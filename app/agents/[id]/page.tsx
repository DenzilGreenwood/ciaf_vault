'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { AgentIdentity, AgentAction, ElevationGrant } from '@/lib/types'

export default function AgentDetailPage() {
  const params = useParams()
  const principal_id = params.id as string

  const [agent, setAgent] = useState<AgentIdentity | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [recentActions, setRecentActions] = useState<AgentAction[]>([])
  const [activeGrants, setActiveGrants] = useState<ElevationGrant[]>([])
  const [violations, setViolations] = useState<AgentAction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (principal_id) {
      fetchAgentDetails()
    }
  }, [principal_id])

  const fetchAgentDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/agents/${principal_id}`)
      const result = await response.json()

      if (result.success) {
        setAgent(result.data.identity)
        setStats(result.data.stats)
        setRecentActions(result.data.recent_actions)
        setActiveGrants(result.data.active_grants)
        setViolations(result.data.recent_violations)
      }
    } catch (error) {
      console.error('Failed to fetch agent details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      revoked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
    return colors[status] || colors.active
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 dark:text-gray-400">Loading agent details...</div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Agent not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/agents" className="text-blue-600 dark:text-blue-400 hover:underline">
        ← Back to Agent Registry
      </Link>

      {/* Agent Identity Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {agent.display_name}
              </h1>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(agent.status)}`}>
                {agent.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-mono">
              {agent.principal_id}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Principal Type</div>
                <div className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{agent.principal_type}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</div>
                <div className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(agent.created_at)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles */}
        <div className="mt-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Roles</div>
          <div className="flex flex-wrap gap-2">
            {agent.roles.map((role, idx) => (
              <span key={idx} className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full">
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Attributes */}
        {Object.keys(agent.attributes).length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Attributes</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(agent.attributes).map(([key, value]) => (
                <div key={key}>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{key}</div>
                  <div className="text-sm text-gray-900 dark:text-white">{String(value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fingerprint */}
        {agent.fingerprint && (
          <div className="mt-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Cryptographic Fingerprint</div>
            <div className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all bg-gray-50 dark:bg-gray-900 p-3 rounded">
              {agent.fingerprint}
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Actions</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_actions || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Allowed</div>
          <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{stats?.actions_allowed || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Denied</div>
          <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{stats?.actions_denied || 0}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Grants</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats?.active_grants || 0}</div>
        </div>
      </div>

      {/* Active Elevation Grants */}
      {activeGrants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Active Elevation Grants</h2>
          </div>
          <div className="p-6 space-y-4">
            {activeGrants.map((grant) => (
              <div key={grant.grant_id} className="border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white">{grant.elevated_role}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{grant.purpose}</div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Approved by: {grant.approved_by} {grant.approval_ticket && `(${grant.approval_ticket})`}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                    <div>Valid until: {formatDate(grant.valid_until)}</div>
                    {grant.max_uses && (
                      <div className="mt-1">
                        Used: {grant.used_count}/{grant.max_uses}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Violations */}
      {violations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Violations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {violations.map((violation) => (
                  <tr key={violation.action_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {violation.action}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {violation.resource_type}: {violation.resource_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400">
                      {violation.reason}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(violation.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Actions Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Action Timeline</h2>
        </div>
        <div className="p-6">
          {recentActions.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No actions recorded yet
            </div>
          ) : (
            <div className="space-y-4">
              {recentActions.slice(0, 20).map((action) => (
                <div key={action.action_id} className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className={`flex-shrink-0 w-3 h-3 rounded-full mt-1 ${action.decision ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{action.action}</span>
                      <span className="text-gray-500 dark:text-gray-400">on</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {action.resource_type}: {action.resource_id}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {action.reason}
                    </div>
                    {action.justification && (
                      <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">
                        &quot;{action.justification}&quot;
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                      <span>{formatDate(action.timestamp)}</span>
                      {action.correlation_id && <span className="font-mono">Correlation: {action.correlation_id}</span>}
                      {action.elevation_grant_id && (
                        <span className="text-yellow-600 dark:text-yellow-400">Elevated: {action.elevation_grant_id}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
