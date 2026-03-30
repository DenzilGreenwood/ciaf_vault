'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { AgentSummary } from '@/lib/types'

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: 'active',
    principal_type: '',
    tenant_id: ''
  })
  const [stats, setStats] = useState({
    total_agents: 0,
    active_agents: 0,
    total_actions_24h: 0,
    violations_24h: 0
  })

  useEffect(() => {
    fetchAgents()
  }, [filter])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter.status) params.append('status', filter.status)
      if (filter.principal_type) params.append('principal_type', filter.principal_type)
      if (filter.tenant_id) params.append('tenant_id', filter.tenant_id)

      const response = await fetch(`/api/agents?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setAgents(result.data || [])
        calculateStats(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (agentData: AgentSummary[]) => {
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    setStats({
      total_agents: agentData.length,
      active_agents: agentData.filter(a => a.status === 'active').length,
      total_actions_24h: agentData
        .filter(a => a.last_action_at && new Date(a.last_action_at) > oneDayAgo)
        .reduce((sum, a) => sum + a.total_actions, 0),
      violations_24h: agentData.reduce((sum, a) => sum + a.actions_denied, 0)
    })
  }

  const getPrincipalTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      agent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      service: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      human: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      system: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
    return colors[type] || colors.agent
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      suspended: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      revoked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
    return colors[status] || colors.active
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Registry</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Agentic Execution Boundaries - Identity & Access Management
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Agents</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.total_agents}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Agents</div>
          <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{stats.active_agents}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Actions (24h)</div>
          <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.total_actions_24h}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Violations (24h)</div>
          <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{stats.violations_24h}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <select
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Principal Type
            </label>
            <select
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filter.principal_type}
              onChange={(e) => setFilter({ ...filter, principal_type: e.target.value })}
            >
              <option value="">All</option>
              <option value="agent">Agent</option>
              <option value="service">Service</option>
              <option value="human">Human</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tenant ID
            </label>
            <input
              type="text"
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Enter tenant ID"
              value={filter.tenant_id}
              onChange={(e) => setFilter({ ...filter, tenant_id: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Registered Agents</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Loading agents...
          </div>
        ) : agents.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            No agents found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Grants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {agents.map((agent) => (
                  <tr key={agent.principal_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {agent.display_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        {agent.principal_id}
                      </div>
                      {agent.tenant_id && (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                          Tenant: {agent.tenant_id}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPrincipalTypeBadgeColor(agent.principal_type)}`}>
                        {agent.principal_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {agent.roles.slice(0, 3).map((role, idx) => (
                          <span key={idx} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {role}
                          </span>
                        ))}
                        {agent.roles.length > 3 && (
                          <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                            +{agent.roles.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 dark:text-green-400">{agent.actions_allowed}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-red-600 dark:text-red-400">{agent.actions_denied}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {agent.active_grants > 0 ? (
                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                          {agent.active_grants} active
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        href={`/agents/${agent.principal_id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/agents/actions" className="block bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Action Log</h3>
          <p className="text-gray-600 dark:text-gray-400">
            View all agent actions and policy decisions across the system
          </p>
        </Link>
        <Link href="/agents/elevations" className="block bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Active Grants</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Manage privilege elevation grants (PAM) for temporary elevated access
          </p>
        </Link>
      </div>
    </div>
  )
}
