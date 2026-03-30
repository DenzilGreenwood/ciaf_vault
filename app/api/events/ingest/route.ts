import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { IngestEventPayload, APIResponse } from '@/lib/types'
import { createHash, randomBytes } from 'crypto'
import { PolicyEngine } from '@/lib/policy/PolicyEngine'
import { PIIDetector } from '@/lib/detection/PIIDetector'
import { ShadowAIDetector } from '@/lib/detection/ShadowAIDetector'

/**
 * POST /api/events/ingest
 * Ingest CIAF events (core or web)
 * 
 * Body:
 * {
 *   "event_type": "core" | "web",
 *   "event_data": { ...event fields },
 *   "generate_receipt": true (optional),
 *   "enforce_policy": true (optional, default: true for web events)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const payload: IngestEventPayload = await request.json()

    // Validate payload
    if (!payload.event_type || !payload.event_data) {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'Missing required fields: event_type, event_data',
        },
        { status: 400 }
      )
    }

    // Generate event_id if not provided
    if (!payload.event_data.event_id) {
      payload.event_data.event_id = `evt_${payload.event_type}_${Date.now()}_${randomBytes(4).toString('hex')}`
    }

    // Set timestamp if not provided
    if (!payload.event_data.timestamp) {
      payload.event_data.timestamp = new Date().toISOString()
    }

    // Policy enforcement for web events
    let policyResult: any = null
    let shadowAIResult: any = null
    let piiResult: any = null

    if (payload.event_type === 'web' && payload.enforce_policy !== false) {
      const webData = payload.event_data as any
      const policyEngine = new PolicyEngine()

      // Evaluate policy
      policyResult = policyEngine.evaluate({
        toolName: webData.tool_name || 'Unknown',
        toolUrl: webData.tool_url,
        content: webData.content_summary || webData.prompt_text,
        orgId: webData.org_id || 'default',
        userId: webData.user_id || 'unknown',
      })

      shadowAIResult = policyResult.shadowAI
      piiResult = policyResult.pii

      // Update event data with policy results
      webData.policy_decision = policyResult.decision
      webData.is_shadow_ai = shadowAIResult?.isShadowAI || false
      webData.pii_detected = piiResult?.detected || false
      webData.pii_types = piiResult?.types || []
      webData.sensitivity_score = piiResult?.sensitivityScore || 0
      webData.detection_method = shadowAIResult?.detectionMethod || null
      webData.policy_rule_id = policyResult.matchedRules[0]?.id || null

      // If blocked, return early
      if (policyResult.decision === 'BLOCK') {
        return NextResponse.json<APIResponse<any>>(
          {
            success: false,
            error: 'Policy violation: Event blocked',
            data: {
              decision: 'BLOCK',
              reason: policyResult.reason,
              shadow_ai: shadowAIResult,
              pii: piiResult,
              matched_rules: policyResult.matchedRules.map((r: any) => r.id),
            },
          },
          { status: 403 }
        )
      }
    }

    // Generate content hash
    const contentHash = createHash('sha256')
      .update(JSON.stringify(payload.event_data))
      .digest('hex')

    let insertedEvent: any

    // Insert based on event type
    if (payload.event_type === 'core') {
      const { data, error } = await supabase
        .from('events_core')
        .insert({
          ...(payload.event_data as any),
          content_hash: contentHash,
        })
        .select()
        .single()

      if (error) throw error
      insertedEvent = data
    } else if (payload.event_type === 'web') {
      const webData = payload.event_data as any
      const { data, error } = await supabase
        .from('events_web')
        .insert({
          ...webData,
          content_hash: contentHash,
          is_shadow_ai: webData.is_shadow_ai ?? false,
          pii_detected: webData.pii_detected ?? false,
        })
        .select()
        .single()

      if (error) throw error
      insertedEvent = data
    } else {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'Invalid event_type. Must be "core" or "web"',
        },
        { status: 400 }
      )
    }

    // Generate receipt if requested
    let receipt: any = null
    if (payload.generate_receipt) {
      const merkleRoot = createHash('sha256')
        .update(contentHash + Date.now().toString())
        .digest('hex')

      const receiptId = `rcpt_${Date.now()}_${randomBytes(4).toString('hex')}`

      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .insert({
          receipt_id: receiptId,
          event_id: payload.event_data.event_id!,
          event_type: payload.event_type,
          content_hash: contentHash,
          merkle_root: merkleRoot,
          signature_algorithm: 'sha256',
          metadata: {},
        } as any)
        .select()
        .single()

      if (receiptError) {
        console.error('Receipt generation error:', receiptError)
      } else {
        receipt = receiptData

        // Update event with receipt_id
        if (payload.event_type === 'core') {
          await supabase
            .from('events_core')
            .update({ receipt_id: (receiptData as any).id } as never)
            .eq('event_id', payload.event_data.event_id!)
        } else {
          await supabase
            .from('events_web')
            .update({ receipt_id: (receiptData as any).id } as never)
            .eq('event_id', payload.event_data.event_id!)
        }
      }
    }

    return NextResponse.json<APIResponse<any>>(
      {
        success: true,
        data: {
          event: insertedEvent,
          receipt: receipt,
          policy: policyResult
            ? {
                decision: policyResult.decision,
                reason: policyResult.reason,
                shadow_ai: shadowAIResult?.isShadowAI,
                pii_detected: piiResult?.detected,
                sensitivity_score: piiResult?.sensitivityScore,
              }
            : null,
        },
        message:
          policyResult?.decision === 'WARN'
            ? `Event ingested with warning: ${policyResult.reason}`
            : 'Event ingested successfully',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Event ingestion error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/events/ingest
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'CIAF Event Ingestion API',
    version: '0.1.0',
    endpoints: {
      ingest: 'POST /api/events/ingest',
    },
  })
}
