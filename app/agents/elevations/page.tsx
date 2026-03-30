'use client'

import { useEffect, useState } from 'react'
import type { ElevationGrant } from '@/lib/types'

export default function ElevationsPage() {
  const [grants, setGrants] = useState<ElevationGrant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveGrants()
  }, [])

  const fetchActiveGrants = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/agents/elevations/active')
      const result = await response.json()

      if (result.success) {
        setGrants(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch grants:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTimeRemaining = (validUntil: string) => {
    const now = new Date()
    const until = new Date(validUntil)
    const diffMs = until.getTime() - now.getTime()
    
    if (diffMs < 0) return 'Expired'
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`
    return `${diffHours}h`
  }

  const getUsagePercentage = (used: number, max: number | null | undefined) => {
    if (!max) return 0
    return Math.round((used / max) * 100)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Active Elevation Grants</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Privileged Access Management (PAM) - Temporary privilege escalations
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Grants</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600 dark:text-yellow-400">{grants.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Expiring Soon (&lt;24h)</div>
          <div className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
            {grants.filter(g => {
              const diffMs = new Date(g.valid_until).getTime() - new Date().getTime()
              return diffMs < 24 * 60 * 60 * 1000
            }).length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Uses</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {grants.reduce((sum, g) => sum + g.used_count, 0)}
          </div>
        </div>
      </div>

      {/* Grants List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Grant Details</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Loading grants...
          </div>
        ) : grants.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            No active grants found
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {grants.map((grant) => {
              const timeRemaining = getTimeRemaining(grant.valid_until)
              const isExpiringSoon = new Date(grant.valid_until).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
              const usagePercent = getUsagePercentage(grant.used_count, grant.max_uses)

              return (
                <div key={grant.grant_id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Grant Header */}
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {grant.elevated_role}
                        </h3>
                        {isExpiringSoon && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            Expiring Soon
                          </span>
                        )}
                      </div>

                      {/* Principal */}
                      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        Principal: <span className="font-mono">{grant.principal_id}</span>
                      </div>

                      {/* Purpose */}
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Purpose:</span> {grant.purpose}
                      </div>

                      {/* Justification */}
                      {grant.justification && (
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 italic">
                          &quot;{grant.justification}&quot;
                        </div>
                      )}

                      {/* Approval Details */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Approved by: <span className="font-medium">{grant.approved_by}</span></span>
                        {grant.approval_ticket && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">
                            {grant.approval_ticket}
                          </span>
                        )}
                      </div>

                      {/* Scope */}
                      {grant.scope && Object.keys(grant.scope).length > 0 && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                          <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Scope:</div>
                          <pre className="text-gray-600 dark:text-gray-400 overflow-x-auto">
                            {JSON.stringify(grant.scope, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Usage Info */}
                      {grant.max_uses && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>Usage: {grant.used_count} / {grant.max_uses}</span>
                            <span>{usagePercent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                usagePercent >= 90 ? 'bg-red-600' : usagePercent >= 70 ? 'bg-yellow-600' : 'bg-green-600'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Time Info */}
                    <div className="ml-6 text-right flex-shrink-0">
                      <div className={`text-2xl font-bold ${
                        isExpiringSoon ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                      }`}>
                        {timeRemaining}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Until {formatDate(grant.valid_until)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Granted {formatDate(grant.granted_at)}
                      </div>
                      {grant.last_used_at && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Last used {formatDate(grant.last_used_at)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
          About Elevation Grants (PAM)
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Elevation grants provide temporary privilege escalation for agents to perform sensitive actions.
          Each grant requires approval, has a limited validity period, and may have usage constraints.
          All elevated actions are tracked in the action log with full audit trails.
        </p>
      </div>
    </div>
  )
}
