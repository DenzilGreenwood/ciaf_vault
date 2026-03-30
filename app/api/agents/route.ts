import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { AgentSummary, APIResponse } from '@/lib/types'

/**
 * GET /api/agents
 * List all agents with optional filtering
 * Query params: ?status=active&principal_type=agent&tenant_id=acme-corp&limit=50&offset=0
 */
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('x-ciaf-api-key')
    if (!apiKey || apiKey !== process.env.CIAF_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as APIResponse<never>,
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'active', 'suspended', 'revoked'
    const principal_type = searchParams.get('principal_type') // 'agent', 'service', 'human', 'system'
    const tenant_id = searchParams.get('tenant_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createServerClient()

    // Use the active_agents_summary view for efficient queries
    let query = supabase
      .from('active_agents_summary')
      .select('*')

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (principal_type) {
      query = query.eq('principal_type', principal_type)
    }
    if (tenant_id) {
      query = query.eq('tenant_id', tenant_id)
    }

    // Apply pagination
    query = query
      .range(offset, offset + limit - 1)
      .order('last_action_at', { ascending: false, nullsFirst: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch agents' } as APIResponse<never>,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as AgentSummary[],
      message: `Retrieved ${data?.length || 0} agents`,
      pagination: {
        limit,
        offset,
        total: count
      }
    } as APIResponse<AgentSummary[]>)

  } catch (error) {
    console.error('Agent list error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as APIResponse<never>,
      { status: 500 }
    )
  }
}
