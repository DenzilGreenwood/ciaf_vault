import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import type { ElevationGrant, APIResponse } from '@/lib/types'

/**
 * GET /api/agents/elevations/active
 * Get all currently active elevation grants (not expired, not revoked)
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

    const supabase = createServerClient()

    // Use the active_elevations view
    let query = supabase
      .from('active_elevations')
      .select('*')

    if (principal_id) {
      query = query.eq('principal_id', principal_id)
    }

    const { data, error } = await query.order('valid_until', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch active grants' } as APIResponse<never>,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as ElevationGrant[],
      message: `Retrieved ${data?.length || 0} active grants`
    } as APIResponse<ElevationGrant[]>)

  } catch (error) {
    console.error('Active grants error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as APIResponse<never>,
      { status: 500 }
    )
  }
}
