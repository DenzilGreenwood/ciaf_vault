import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { RegisterAgentPayload, AgentIdentity, APIResponse } from '@/lib/types'
import crypto from 'crypto'

/**
 * POST /api/agents/register
 * Register a new agent identity in the CIAF Vault
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

    const payload: RegisterAgentPayload = await request.json()

    // Validate required fields
    if (!payload.principal_id || !payload.display_name || !payload.principal_type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: principal_id, display_name, principal_type' } as APIResponse<never>,
        { status: 400 }
      )
    }

    // Validate principal_type
    const validTypes = ['agent', 'service', 'human', 'system']
    if (!validTypes.includes(payload.principal_type)) {
      return NextResponse.json(
        { success: false, error: `Invalid principal_type. Must be one of: ${validTypes.join(', ')}` } as APIResponse<never>,
        { status: 400 }
      )
    }

    // Generate cryptographic fingerprint
    const fingerprintData = {
      principal_id: payload.principal_id,
      principal_type: payload.principal_type,
      roles: payload.roles || [],
      attributes: payload.attributes || {}
    }
    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprintData))
      .digest('hex')

    // Insert into database
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('agent_identities')
      .insert({
        principal_id: payload.principal_id,
        principal_type: payload.principal_type,
        display_name: payload.display_name,
        roles: payload.roles || [],
        attributes: payload.attributes || {},
        fingerprint,
        status: 'active',
        created_by: payload.created_by || 'system'
      } as any)
      .select()
      .single()

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: `Agent with principal_id '${payload.principal_id}' already exists` } as APIResponse<never>,
          { status: 409 }
        )
      }

      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to register agent' } as APIResponse<never>,
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        data: data as AgentIdentity,
        message: 'Agent registered successfully'
      } as APIResponse<AgentIdentity>,
      { status: 201 }
    )

  } catch (error) {
    console.error('Agent registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as APIResponse<never>,
      { status: 500 }
    )
  }
}
