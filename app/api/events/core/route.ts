import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { APIResponse } from '@/lib/types'

/**
 * GET /api/events/core
 * Fetch core AI model lifecycle events with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const modelName = searchParams.get('model_name')
    const eventType = searchParams.get('event_type')
    const stage = searchParams.get('stage')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    // Build query
    let query = supabase
      .from('events_core')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (modelName) {
      query = query.eq('model_name', modelName)
    }
    if (eventType) {
      query = query.eq('event_type', eventType)
    }
    if (stage) {
      query = query.eq('stage', stage)
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
    console.error('Core events fetch error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
