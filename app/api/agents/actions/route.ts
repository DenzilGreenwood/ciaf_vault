import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { AgentAction, APIResponse } from '@/lib/types'

/**
 * GET /api/agents/actions
 * List all agent actions with filtering
 * Query params: ?principal_id=agent-001&decision=false&action=approve_payment&limit=100&offset=0
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
    const principal_id = searchParams.get('principal_id')
    const decision = searchParams.get('decision') // 'true' or 'false'
    const action = searchParams.get('action')
    const resource_type = searchParams.get('resource_type')
    const correlation_id = searchParams.get('correlation_id')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createServerClient()

    let query = supabase
      .from('agent_actions')
      .select('*', { count: 'exact' })

    // Apply filters
    if (principal_id) {
      query = query.eq('principal_id', principal_id)
    }
    if (decision !== null && decision !== undefined) {
      query = query.eq('decision', decision === 'true')
    }
    if (action) {
      query = query.eq('action', action)
    }
    if (resource_type) {
      query = query.eq('resource_type', resource_type)
    }
    if (correlation_id) {
      query = query.eq('correlation_id', correlation_id)
    }
    if (start_date) {
      query = query.gte('timestamp', start_date)
    }
    if (end_date) {
      query = query.lte('timestamp', end_date)
    }

    // Apply pagination and ordering
    query = query
      .range(offset, offset + limit - 1)
      .order('timestamp', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch actions' } as APIResponse<never>,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as AgentAction[],
      message: `Retrieved ${data?.length || 0} actions`,
      pagination: {
        limit,
        offset,
        total: count
      }
    } as APIResponse<AgentAction[]>)

  } catch (error) {
    console.error('Actions list error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as APIResponse<never>,
      { status: 500 }
    )
  }
}
