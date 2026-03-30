import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { GrantElevationRequest, ElevationGrant, APIResponse } from '@/lib/types'
import crypto from 'crypto'

/**
 * POST /api/agents/elevations/grant
 * Create a new privilege elevation grant (PAM)
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

    const payload: GrantElevationRequest = await request.json()

    // Validate required fields
    if (!payload.principal_id || !payload.elevated_role || !payload.approved_by || !payload.purpose || !payload.valid_until) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: principal_id, elevated_role, approved_by, purpose, valid_until' } as APIResponse<never>,
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Verify agent exists
    const { data: agent, error: agentError } = await supabase
      .from('agent_identities')
      .select('*')
      .eq('principal_id', payload.principal_id)
      .single()

    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' } as APIResponse<never>,
        { status: 404 }
      )
    }

    // Generate grant_id
    const grant_id = `grant-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`

    // Validate dates
    const valid_from = payload.valid_from ? new Date(payload.valid_from) : new Date()
    const valid_until = new Date(payload.valid_until)

    if (valid_until <= valid_from) {
      return NextResponse.json(
        { success: false, error: 'valid_until must be after valid_from' } as APIResponse<never>,
        { status: 400 }
      )
    }

    // Insert grant
    const { data, error } = await supabase
      .from('elevation_grants')
      .insert({
        grant_id,
        principal_id: payload.principal_id,
        elevated_role: payload.elevated_role,
        scope: payload.scope || {},
        approved_by: payload.approved_by,
        approval_ticket: payload.approval_ticket,
        purpose: payload.purpose,
        justification: payload.justification,
        valid_from: valid_from.toISOString(),
        valid_until: valid_until.toISOString(),
        max_uses: payload.max_uses,
        status: 'active',
        metadata: {}
      } as any)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create elevation grant' } as APIResponse<never>,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as ElevationGrant,
      message: 'Elevation grant created successfully'
    } as APIResponse<ElevationGrant>,
    { status: 201 })

  } catch (error) {
    console.error('Grant creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as APIResponse<never>,
      { status: 500 }
    )
  }
}
