import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { ExecuteActionRequest, ExecuteActionResponse, APIResponse } from '@/lib/types'
import crypto from 'crypto'

/**
 * POST /api/agents/actions/execute
 * Execute an action with full IAM/PAM checks and policy evaluation
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-ciaf-api-key')
    if (!apiKey || apiKey !== process.env.CIAF_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as APIResponse<never>,
        { status: 401 }
      )
    }

    const payload: ExecuteActionRequest = await request.json()

    // Validate required fields
    if (!payload.principal_id || !payload.action || !payload.resource) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: principal_id, action, resource' } as APIResponse<never>,
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // 1. Verify agent exists and is active
    const { data: agent, error: agentError } = await supabase
      .from('agent_identities')
      .select('*')
      .eq('principal_id', payload.principal_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json({
        success: false,
        data: {
          allowed: false,
          reason: 'Agent not found or inactive',
          action_id: '',
        } as ExecuteActionResponse
      } as APIResponse<ExecuteActionResponse>)
    }

    if ((agent as any).status !== 'active') {
      return NextResponse.json({
        success: false,
        data: {
          allowed: false,
          reason: `Agent status is '${(agent as any).status}'`,
          action_id: '',
        } as ExecuteActionResponse
      } as APIResponse<ExecuteActionResponse>)
    }

    // 2. Evaluate IAM - Check if agent has required role
    const decision = await evaluateIAM(agent, payload)

    // 3. If denied but elevation grant provided, check PAM
    let elevationGrantUsed = null
    if (!decision.allowed && payload.elevation_grant_id) {
      const pamResult = await evaluatePAM(supabase, payload.elevation_grant_id, payload.principal_id, payload.action)
      if (pamResult.valid) {
        decision.allowed = true
        decision.reason = `Action allowed via elevation grant: ${payload.elevation_grant_id}`
        elevationGrantUsed = payload.elevation_grant_id
      }
    }

    // 4. Generate action ID and params hash
    const action_id = `action-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`
    const params_hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(payload.params || {}))
      .digest('hex')

    // 5. Record action in database
    const { data: actionRecord, error: actionError } = await supabase
      .from('agent_actions')
      .insert({
        action_id,
        principal_id: payload.principal_id,
        principal_type: (agent as any).principal_type,
        action: payload.action,
        resource_id: payload.resource.resource_id,
        resource_type: payload.resource.resource_type,
        resource_tenant: payload.resource.resource_tenant,
        params: payload.params || {},
        params_hash,
        justification: payload.justification,
        correlation_id: payload.correlation_id,
        decision: decision.allowed,
        reason: decision.reason,
        elevation_grant_id: elevationGrantUsed,
        executed: false, // Will be updated when action completes
        policy_obligations: decision.policy_obligations || [],
        metadata: {}
      } as any)
      .select()
      .single()

    if (actionError) {
      console.error('Failed to record action:', actionError)
    }

    // 6. Generate cryptographic receipt if action allowed
    let receipt = null
    if (decision.allowed && actionRecord) {
      receipt = await generateAgentReceipt(supabase, actionRecord, agent, params_hash, elevationGrantUsed)
    }

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: {
        allowed: decision.allowed,
        reason: decision.reason,
        action_id,
        receipt,
        policy_obligations: decision.policy_obligations,
        elevation_required: decision.elevation_required,
        available_roles: (agent as any).roles
      } as ExecuteActionResponse
    } as APIResponse<ExecuteActionResponse>,
    { status: decision.allowed ? 200 : 403 })

  } catch (error) {
    console.error('Action execution error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as APIResponse<never>,
      { status: 500 }
    )
  }
}

/**
 * Evaluate Identity & Access Management (IAM)
 */
async function evaluateIAM(agent: any, request: ExecuteActionRequest) {
  // Simple role-based access control
  // In production, this would be a sophisticated policy engine
  
  const actionRoleMap: Record<string, string[]> = {
    'read': ['viewer', 'analyst', 'admin'],
    'write': ['editor', 'admin'],
    'delete': ['admin'],
    'approve_payment': ['payment_approver', 'finance_admin', 'admin'],
    'deploy_model': ['ml_engineer', 'deployment_admin', 'admin'],
    'access_pii': ['data_steward', 'compliance_officer', 'admin']
  }

  const requiredRoles = actionRoleMap[request.action] || ['admin']
  const hasRole = agent.roles.some((role: string) => requiredRoles.includes(role))

  if (hasRole) {
    return {
      allowed: true,
      reason: `Agent has required role for action '${request.action}'`,
      policy_obligations: []
    }
  }

  return {
    allowed: false,
    reason: `Agent lacks required role for action '${request.action}'. Required: ${requiredRoles.join(' or ')}`,
    policy_obligations: [],
    elevation_required: true
  }
}

/**
 * Evaluate Privileged Access Management (PAM)
 */
async function evaluatePAM(supabase: any, grant_id: string, principal_id: string, action: string) {
  const { data: grant, error } = await supabase
    .from('elevation_grants')
    .select('*')
    .eq('grant_id', grant_id)
    .eq('principal_id', principal_id)
    .single()

  if (error || !grant) {
    return { valid: false, reason: 'Elevation grant not found' }
  }

  // Check status
  if (grant.status !== 'active') {
    return { valid: false, reason: `Grant status is '${grant.status}'` }
  }

  // Check validity period
  const now = new Date()
  const validFrom = new Date(grant.valid_from)
  const validUntil = new Date(grant.valid_until)

  if (now < validFrom || now > validUntil) {
    return { valid: false, reason: 'Grant has expired or not yet valid' }
  }

  // Check usage limits
  if (grant.max_uses && grant.used_count >= grant.max_uses) {
    return { valid: false, reason: 'Grant usage limit exceeded' }
  }

  // Check scope - does this grant cover this action?
  const scope = grant.scope || {}
  if (scope.actions && !scope.actions.includes(action)) {
    return { valid: false, reason: 'Action not in grant scope' }
  }

  return { valid: true, grant }
}

/**
 * Generate cryptographic receipt for agent action
 */
async function generateAgentReceipt(supabase: any, action: any, agent: any, params_hash: string, elevation_grant_id: string | null) {
  // Get prior receipt for hash chain
  const { data: priorReceipt } = await supabase
    .from('agent_receipts')
    .select('receipt_hash')
    .eq('principal_id', agent.principal_id)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single()

  const prior_receipt_hash = priorReceipt?.receipt_hash || '0000000000000000000000000000000000000000000000000000000000000000'

  const receipt_id = `receipt-agent-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`
  
  // Create receipt hash
  const receiptData = {
    receipt_id,
    action_id: action.action_id,
    principal_id: agent.principal_id,
    action: action.action,
    resource_id: action.resource_id,
    params_hash,
    prior_receipt_hash,
    timestamp: action.timestamp
  }

  const receipt_hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(receiptData))
    .digest('hex')

  // Create HMAC signature
  const signature = crypto
    .createHmac('sha256', process.env.CIAF_API_KEY || 'default-secret')
    .update(receipt_hash)
    .digest('hex')

  // Store receipt
  const { data: receipt, error } = await supabase
    .from('agent_receipts')
    .insert({
      receipt_id,
      action_id: action.action_id,
      principal_id: agent.principal_id,
      principal_type: agent.principal_type,
      action: action.action,
      resource_id: action.resource_id,
      resource_type: action.resource_type,
      correlation_id: action.correlation_id,
      decision: action.decision,
      reason: action.reason,
      elevation_grant_id,
      params_hash,
      prior_receipt_hash,
      receipt_hash,
      signature,
      signature_algorithm: 'hmac-sha256',
      policy_obligations: action.policy_obligations || [],
      metadata: {}
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to generate receipt:', error)
    return null
  }

  // Update action with receipt_id
  await supabase
    .from('agent_actions')
    .update({ receipt_id: receipt.id })
    .eq('action_id', action.action_id)

  return receipt
}
