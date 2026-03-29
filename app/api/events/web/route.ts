import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { APIResponse } from '@/lib/types'

/**
 * GET /api/events/web
 * Fetch web AI governance events with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const orgId = searchParams.get('org_id')
    const userId = searchParams.get('user_id')
    const toolName = searchParams.get('tool_name')
    const policyDecision = searchParams.get('policy_decision')
    const shadowAiOnly = searchParams.get('shadow_ai') === 'true'
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Build query
    let query = supabase
      .from('events_web')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (orgId) {
      query = query.eq('org_id', orgId)
    }
    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (toolName) {
      query = query.eq('tool_name', toolName)
    }
    if (policyDecision) {
      query = query.eq('policy_decision', policyDecision)
    }
    if (shadowAiOnly) {
      query = query.eq('is_shadow_ai', true)
    }
    if (startDate) {
      query = query.gte('timestamp', startDate)
    }
    if (endDate) {
      query = query.lte('timestamp', endDate)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json<APIResponse<any>>({
      success: true,
      data: {
        events: data,
        total: count,
        limit,
        offset,
      },
    })
  } catch (error: any) {
    console.error('Web events fetch error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
