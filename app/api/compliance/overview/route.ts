import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { ComplianceScorer } from '@/lib/compliance/ComplianceScorer'
import type { APIResponse } from '@/lib/types'

/**
 * GET /api/compliance/overview
 * Get overall compliance status across all frameworks
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Fetch recent data for compliance evaluation
    const [eventsResult, auditResult, receiptsResult] = await Promise.all([
      supabase.from('events_core').select('*').limit(1000),
      supabase.from('audit_trails').select('*').limit(1000),
      supabase.from('receipts').select('*').limit(1000),
    ])

    const events = eventsResult.data || []
    const auditTrails = auditResult.data || []
    const receipts = receiptsResult.data || []

    // Calculate compliance scores
    const scorer = new ComplianceScorer()
    const complianceScore = scorer.calculate(events, auditTrails, receipts)

    return NextResponse.json<APIResponse<any>>(
      {
        success: true,
        data: complianceScore,
        message: 'Compliance overview retrieved successfully',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Compliance overview error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
