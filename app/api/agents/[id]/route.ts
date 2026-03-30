import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { AgentIdentity, AgentAction, APIResponse } from '@/lib/types'

/**
 * GET /api/agents/[id]
 * Get detailed information about a specific agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-ciaf-api-key')
    if (!apiKey || apiKey !== process.env.CIAF_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as APIResponse<never>,
        { status: 401 }
      )
    }

    const principal_id = params.id
    const supabase = createServerClient()

    // Get agent identity
    const { data: identity, error: identityError } = await supabase
      .from('agent_identities')
      .select('*')
      .eq('principal_id', principal_id)
      .single()

    if (identityError || !identity) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' } as APIResponse<never>,
        { status: 404 }
      )
    }

    // Get recent actions (last 100)
    const { data: actions, error: actionsError } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('principal_id', principal_id)
      .order('timestamp', { ascending: false })
      .limit(100)

    // Get active grants
    const { data: grants, error: grantsError } = await supabase
      .from('elevation_grants')
      .select('*')
      .eq('principal_id', principal_id)
      .eq('status', 'active')
      .order('granted_at', { ascending: false })

    // Get violations (denied actions)
    const { data: violations, error: violationsError } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('principal_id', principal_id)
      .eq('decision', false)
      .order('timestamp', { ascending: false })
      .limit(50)

    // Calculate statistics
    const stats = {
      total_actions: actions?.length || 0,
      actions_allowed: actions?.filter((a: any) => a.decision === true).length || 0,
      actions_denied: actions?.filter((a: any) => a.decision === false).length || 0,
      active_grants: grants?.length || 0,
      recent_violations: violations?.length || 0,
      last_action_at: (actions as any)?.[0]?.timestamp || null
    }

    return NextResponse.json({
      success: true,
      data: {
        identity: identity as AgentIdentity,
        stats,
        recent_actions: (actions || []) as AgentAction[],
        active_grants: grants || [],
        recent_violations: violations || []
      }
    } as APIResponse<any>)

  } catch (error) {
    console.error('Agent detail error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as APIResponse<never>,
      { status: 500 }
    )
  }
}
