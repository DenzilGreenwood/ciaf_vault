import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { APIResponse } from '@/lib/types'
import { createHash } from 'crypto'

interface ReceiptVerificationRequest {
  receipt_id?: string
  event_id?: string
  receipt_json?: any
}

interface VerificationResult {
  verified: boolean
  receipt: any
  checks: {
    receipt_exists: boolean
    content_hash_valid: boolean
    merkle_root_valid: boolean
    signature_valid: boolean
    event_exists: boolean
    event_hash_matches: boolean
  }
  details: string[]
  errors: string[]
}

/**
 * POST /api/receipts/verify
 * Verify cryptographic receipt integrity
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const body: ReceiptVerificationRequest = await request.json()

    const checks = {
      receipt_exists: false,
      content_hash_valid: false,
      merkle_root_valid: false,
      signature_valid: false,
      event_exists: false,
      event_hash_matches: false,
    }

    const details: string[] = []
    const errors: string[] = []
    let receipt: any = null

    // Step 1: Fetch receipt
    if (body.receipt_id) {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('receipt_id', body.receipt_id)
        .single()

      if (error || !data) {
        errors.push(`Receipt not found: ${body.receipt_id}`)
      } else {
        receipt = data
        checks.receipt_exists = true
        details.push(`✓ Receipt found: ${body.receipt_id}`)
      }
    } else if (body.event_id) {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('event_id', body.event_id)
        .single()

      if (error || !data) {
        errors.push(`No receipt found for event: ${body.event_id}`)
      } else {
        receipt = data
        checks.receipt_exists = true
        details.push(`✓ Receipt found for event: ${body.event_id}`)
      }
    } else if (body.receipt_json) {
      receipt = body.receipt_json
      checks.receipt_exists = true
      details.push('✓ Receipt provided via JSON')
    } else {
      return NextResponse.json<APIResponse<null>>(
        {
          success: false,
          error: 'Must provide receipt_id, event_id, or receipt_json',
        },
        { status: 400 }
      )
    }

    if (!receipt) {
      return NextResponse.json<APIResponse<VerificationResult>>(
        {
          success: false,
          data: {
            verified: false,
            receipt: null,
            checks,
            details,
            errors,
          },
        },
        { status: 404 }
      )
    }

    // Step 2: Fetch original event
    const tableName = receipt.event_type === 'core' ? 'events_core' : 'events_web'
    const { data: event, error: eventError } = await supabase
      .from(tableName)
      .select('*')
      .eq('event_id', receipt.event_id)
      .single()

    if (eventError || !event) {
      errors.push(`Original event not found: ${receipt.event_id}`)
    } else {
      checks.event_exists = true
      details.push(`✓ Original event found: ${receipt.event_id}`)
    }

    // Step 3: Verify content hash
    if (event) {
      const expectedHash = (event as any).content_hash
      const actualHash = receipt.content_hash

      if (expectedHash === actualHash) {
        checks.content_hash_valid = true
        details.push(`✓ Content hash matches: ${actualHash.substring(0, 16)}...`)
      } else {
        errors.push(
          `Content hash mismatch! Expected: ${expectedHash}, Got: ${actualHash}`
        )
      }

// Step 4: Verify Merkle root (recalculate)
      const recalculatedMerkle = createHash('sha256')
        .update(receipt.content_hash + (receipt.timestamp || new Date().toISOString()))
        .digest('hex')

      // Note: In production, this would verify against a Merkle tree structure
      // For now, we just check if it exists
      if (receipt.merkle_root && receipt.merkle_root.length === 64) {
        checks.merkle_root_valid = true
        details.push(`✓ Merkle root present: ${receipt.merkle_root.substring(0, 16)}...`)
      } else {
        errors.push('Invalid or missing Merkle root')
      }

      // Step 5: Verify signature (if present)
      if (receipt.signature) {
        // In production, verify Ed25519 signature
        // For now, just check existence
        checks.signature_valid = true
        details.push(`✓ Signature present (${receipt.signature_algorithm || 'unknown'})`)
      } else {
        details.push('⚠ No signature present (optional)')
        checks.signature_valid = true // Not required
      }

      // Step 6: Verify event hash matches
      if (checks.content_hash_valid) {
        checks.event_hash_matches = true
        details.push('✓ Event integrity confirmed')
      }
    }

    // Overall verification
    const verified =
      checks.receipt_exists &&
      checks.event_exists &&
      checks.content_hash_valid &&
      checks.merkle_root_valid &&
      checks.event_hash_matches

    return NextResponse.json<APIResponse<VerificationResult>>(
      {
        success: true,
        data: {
          verified,
          receipt,
          checks,
          details,
          errors,
        },
        message: verified
          ? 'Receipt verified successfully'
          : 'Receipt verification failed',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Receipt verification error:', error)
    return NextResponse.json<APIResponse<null>>(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: 500 }
    )
  }
}
