import { createServerClient } from '@/lib/supabase'
import type { ElevationGrant } from '@/lib/types'
import ElevationsClientView from './ElevationsClientView'

export default async function ElevationsPage() {
  const supabase = createServerClient()

  // Fetch active elevation grants
  const { data: grants, error } = await supabase
    .from('active_elevations')
    .select('*')
    .order('granted_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch grants:', error)
  }

  const grantsData = (grants || []) as ElevationGrant[]

  return <ElevationsClientView initialGrants={grantsData} />
}