'use client'

import { useState, useMemo } from 'react'
import type { AgentAction } from '@/lib/types'

interface ActionsClientViewProps {
  initialActions: AgentAction[]
  initialStats: {
    total: number
    allowed: number
    denied: number
    elevated: number
  }
}

export default function ActionsClientView({ initialActions, initialStats }: ActionsClientViewProps) {
  const [filters, setFilters] = useState({
    principal_id: '',
    action: '',
    decision: '',
    resource_type: '',
    start_date: '',
    end_date: ''
  })

  // Client-side filtering
  const filteredActions = useMemo(() => {
    return initialActions.filter(action => {
      if (filters.principal_id && !action.principal_id.toLowerCase().includes(filters.principal_id.toLowerCase())) {
        return false
      }
      if (filters.action && !action.action.toLowerCase().includes(filters.action.toLowerCase())) {
        return false
      }
      if (filters.decision && action.decision.toString() !== filters.decision) {
        return false
      }
      if (filters.resource_type && !action.resource_type.toLowerCase().includes(filters.resource_type.toLowerCase())) {
        return false
      }
      if (filters.start_date) {
        const actionDate = new Date(action.timestamp)
        const startDate = new Date(filters.start_date)
        if (actionDate < startDate) return false
      }
      if (filters.end_date) {
        const actionDate = new Date(action.timestamp)
        const endDate = new Date(filters.end_date)
        if (actionDate > endDate) return false
      }
      return true
    })
  }, [initialActions, filters])

  // Update stats based on filtered data
  const stats = useMemo(() => {
    return {
      total: filteredActions.length,
      allowed: filteredActions.filter(a => a.decision === true).length,
      denied: filteredActions.filter(a => a.decision === false).length,
      elevated: filteredActions.filter(a => a.elevation_grant_id).length
    }
  }, [filteredActions])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const clearFilters = () => {
    setFilters({
      principal_id: '',
      action: '',
      decision: '',
      resource_type: '',
      start_date: '',
      end_date: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Agent Action Log</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Complete audit trail of all agent executions and policy decisions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Actions</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
          {hasActiveFilters && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">of {initialStats.total} total</div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Allowed</div>
          <div className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">{stats.allowed}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Denied</div>
          <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">{stats.denied}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Elevated</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.elevated}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Principal ID
            </label>
            <input
              type="text"
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="agent-001"
              value={filters.principal_id}
              onChange={(e) => setFilters({ ...filters, principal_id: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action
            </label>
            <input
              type="text"
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="approve_payment"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Decision
            </label>
            <select
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.decision}
              onChange={(e) => setFilters({ ...filters, decision: e.target.value })}
            >
              <option value="">All</option>
              <option value="true">Allowed</option>
              <option value="false">Denied</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Resource Type
            </label>
            <input
              type="text"
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="payment, record, model"
              value={filters.resource_type}
              onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="datetime-local"
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Actions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Action History</h2>
        </div>

        {filteredActions.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            {hasActiveFilters ? 'No actions match your filters' : 'No actions found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Decision
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredActions.map((action) => (
                  <tr key={action.action_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        action.decision 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}>
                        {action.decision ? 'ALLOW' : 'DENY'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white font-mono">
                        {action.principal_id}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {action.principal_type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {action.action}
                      </div>
                      {action.elevation_grant_id && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">
                          ⬆ Elevated
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {action.resource_type}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {action.resource_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate" title={action.reason}>
                        {action.reason}
                      </div>
                      {action.justification && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-1 max-w-xs truncate" title={action.justification}>
                          &quot;{action.justification}&quot;
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(action.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
