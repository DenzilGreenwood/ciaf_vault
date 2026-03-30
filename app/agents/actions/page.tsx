import { createServerClient } from '@/lib/supabase'
import type { AgentAction } from '@/lib/types'
import ActionsClientView from './ActionsClientView'

export default async function AgentActionsPage() {
  const supabase = createServerClient()

  // Fetch recent actions (last 1000)
  const { data: actions, error } = await supabase
    .from('agent_actions')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1000)

  if (error) {
    console.error('Failed to fetch actions:', error)
  }

  const actionsData = (actions || []) as AgentAction[]

  // Calculate stats
  const stats = {
    total: actionsData.length,
    allowed: actionsData.filter(a => a.decision === true).length,
    denied: actionsData.filter(a => a.decision === false).length,
    elevated: actionsData.filter(a => a.elevation_grant_id).length
  }

  return <ActionsClientView initialActions={actionsData} initialStats={stats} />
}
