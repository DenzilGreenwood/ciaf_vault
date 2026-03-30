import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import type { AgentSummary } from '@/lib/types'
import AgentsClientView from './AgentsClientView'

export default async function AgentsPage() {
  const supabase = createServerClient()
  
  // Fetch agents from active_agents_summary view
  const { data: agents, error } = await supabase
    .from('active_agents_summary')
    .select('*')
    .order('last_action_at', { ascending: false, nullsFirst: false })

  if (error) {
    console.error('Failed to fetch agents:', error)
  }

  // Calculate stats
  const agentData = (agents || []) as AgentSummary[]
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const stats = {
    total_agents: agentData.length,
    active_agents: agentData.filter(a => a.status === 'active').length,
    total_actions_24h: agentData
      .filter(a => a.last_action_at && new Date(a.last_action_at) > oneDayAgo)
      .reduce((sum, a) => sum + (a.total_actions || 0), 0),
    violations_24h: agentData.reduce((sum, a) => sum + (a.actions_denied || 0), 0)
  }

  return (
    <AgentsClientView initialAgents={agentData} initialStats={stats} />
  )
}
