import { createServerClient } from '@/lib/supabase'
import type { AgentIdentity, AgentAction, ElevationGrant } from '@/lib/types'
import AgentDetailClientView from './AgentDetailClientView'

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const principal_id = params.id
  const supabase = createServerClient()

  // Get agent identity
  const { data: agent, error: agentError } = await supabase
    .from('agent_identities')
    .select('*')
    .eq('principal_id', principal_id)
    .single()

  if (agentError || !agent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Agent not found</div>
      </div>
    )
  }

  // Get recent actions (last 100)
  const { data: actions } = await supabase
    .from('agent_actions')
    .select('*')
    .eq('principal_id', principal_id)
    .order('timestamp', { ascending: false })
    .limit(100)

  // Get active grants
  const { data: grants } = await supabase
    .from('elevation_grants')
    .select('*')
    .eq('principal_id', principal_id)
    .eq('status', 'active')
    .order('granted_at', { ascending: false })

  // Get violations (denied actions)
  const { data: violations } = await supabase
    .from('agent_actions')
    .select('*')
    .eq('principal_id', principal_id)
    .eq('decision', false)
    .order('timestamp', { ascending: false })
    .limit(50)

  // Calculate statistics
  const stats = {
    total_actions: actions?.length || 0,
    actions_allowed: actions?.filter((a: any) => a.decision === true).length || 0,
    actions_denied: actions?.filter((a: any) => a.decision === false).length || 0,
    active_grants: grants?.length || 0,
    recent_violations: violations?.length || 0,
    last_action_at: (actions as any)?.[0]?.timestamp || null
  }

  return (
    <AgentDetailClientView 
      agent={agent as AgentIdentity}
      stats={stats}
      recentActions={(actions || []) as AgentAction[]}
      activeGrants={(grants || []) as ElevationGrant[]}
      violations={(violations || []) as AgentAction[]}
    />
  )
}
