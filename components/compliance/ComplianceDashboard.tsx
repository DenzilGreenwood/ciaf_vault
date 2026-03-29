'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ComplianceEvent } from '@/lib/types'
import { formatTimestamp } from '@/lib/utils'
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react'

export function ComplianceDashboard() {
  const [events, setEvents] = useState<ComplianceEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFramework, setSelectedFramework] = useState<string>('')

  useEffect(() => {
    fetchCompliance()
  }, [])

  const fetchCompliance = async () => {
    try {
      const { data, error } = await supabase
        .from('compliance_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)

      if (error) throw error
      setEvents(data as any[])
    } catch (error) {
      console.error('Error fetching compliance events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = selectedFramework
    ? events.filter((e) => e.framework === selectedFramework)
    : events

  const frameworks = [...new Set(events.map((e) => e.framework))]

  const statusCounts = {
    compliant: events.filter((e) => e.status === 'compliant').length,
    violation: events.filter((e) => e.status === 'violation').length,
    warning: events.filter((e) => e.status === 'warning').length,
    pending: events.filter((e) => e.status === 'pending').length,
  }

  const complianceScore = events.length > 0
    ? Math.round((statusCounts.compliant / events.length) * 100)
    : 100

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'violation':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-blue-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'violation':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Compliance Score Card */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">Overall Compliance Score</h2>
        <div className="flex items-end gap-4">
          <div className="text-6xl font-bold">{complianceScore}%</div>
          <div className="mb-2">
            <div className="text-sm opacity-90">
              {statusCounts.compliant} / {events.length} Compliant
            </div>
            <div className="text-sm opacity-90">
              {statusCounts.violation} Violations{' '}
              {statusCounts.warning} Warnings
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Compliant</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.compliant}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Violations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.violation}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Warnings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.warning}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.pending}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Compliance Events
            </h3>
            <select
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Frameworks</option>
              {frameworks.map((fw) => (
                <option key={fw} value={fw}>
                  {fw}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Framework
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Control
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Finding
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No compliance events found
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(event.status)}
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            event.status
                          )}`}
                        >
                          {event.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {event.framework}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.control_id}
                      </div>
                      {event.control_description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                          {event.control_description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
                      {event.finding || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {event.severity && (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            event.severity === 'critical'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : event.severity === 'high'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              : event.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {event.severity}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatTimestamp(event.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
