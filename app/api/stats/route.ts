import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { APIResponse, DashboardStats } from '@/lib/types'

/**
 * GET /api/stats
 * Fetch dashboard statistics
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 7)

    // Get total events
    const { count: totalEventsCore } = await supabase
      .from('events_core')
      .select('*', { count: 'exact', head: true })

    const { count: totalEventsWeb } = await supabase
      .from('events_web')
      .select('*', { count: 'exact', head: true })

    const totalEvents = (totalEventsCore || 0) + (totalEventsWeb || 0)

    // Get events today
    const { count: eventsTodayCore } = await supabase
      .from('events_core')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', today.toISOString())

    const { count: eventsTodayWeb } = await supabase
      .from('events_web')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', today.toISOString())

    const eventsToday = (eventsTodayCore || 0) + (eventsTodayWeb || 0)

    // Get shadow AI detections (last 7 days)
    const { count: shadowAiDetections } = await supabase
      .from('events_web')
      .select('*', { count: 'exact', head: true })
      .eq('is_shadow_ai', true)
      .gte('timestamp', weekAgo.toISOString())

    // Get blocked actions
    const { count: blockedActions } = await supabase
      .from('events_web')
      .select('*', { count: 'exact', head: true })
      .eq('policy_decision', 'block')

    // Get active models
    const { data: activeModels } = await supabase
      .from('events_core')
      .select('model_name')
      .not('model_name', 'is', null)

    const uniqueModels = new Set(activeModels?.map((e: any) => e.model_name) || [])

    // Get compliance violations
    const { count: complianceViolations } = await supabase
      .from('compliance_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'violation')

    const stats: DashboardStats = {
      total_events: totalEvents,
      events_today: eventsToday,
      shadow_ai_detections_7d: shadowAiDetections || 0,
      blocked_actions: blockedActions || 0,
      active_models: uniqueModels.size,
      compliance_violations: complianceViolations || 0,
    }

    return NextResponse.json<APIResponse<DashboardStats>>({
      success: true,
      data: stats,
    })
  } catch (error: any) {
    console.error('Stats fetch error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
