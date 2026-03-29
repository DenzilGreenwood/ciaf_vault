'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { WebEvent } from '@/lib/types'
import {
  formatTimestamp,
  getEventBadgeColor,
  getPolicyDecisionColor,
  getSensitivityColor,
} from '@/lib/utils'
import { AlertTriangle, Search, Shield } from 'lucide-react'

export function WebEventsTable() {
  const [events, setEvents] = useState<WebEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDecision, setFilterDecision] = useState<string>('')
  const [shadowAiOnly, setShadowAiOnly] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('events_web')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)

      const { data, error } = await query

      if (error) throw error
      setEvents(data as any[])
    } catch (error) {
      console.error('Error fetching web events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      !searchTerm ||
      event.tool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.org_id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDecision =
      !filterDecision || event.policy_decision === filterDecision

    const matchesShadowAi = !shadowAiOnly || event.is_shadow_ai

    return matchesSearch && matchesDecision && matchesShadowAi
  })

  const shadowAiCount = events.filter((e) => e.is_shadow_ai).length

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Shadow AI Alert */}
      {shadowAiCount > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <div>
              <h3 className="font-semibold text-orange-900 dark:text-orange-200">
                {shadowAiCount} Shadow AI Detection{shadowAiCount > 1 ? 's' : ''}
              </h3>
              <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                Unauthorized AI tools detected. Review and take action.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tool, user, or org..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Policy Decisions</option>
              <option value="allow">Allow</option>
              <option value="warn">Warn</option>
              <option value="block">Block</option>
            </select>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={shadowAiOnly}
                onChange={(e) => setShadowAiOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Shadow AI Only
              </span>
            </label>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {filteredEvents.length} of {events.length} events
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User/Org
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tool
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Event Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Policy Decision
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sensitivity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Shadow AI
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No events found matching your filters
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr
                    key={event.event_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                      {formatTimestamp(event.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.user_id}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {event.org_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.tool_name}
                      </div>
                      {event.tool_category && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {event.tool_category}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">  
                            <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventBadgeColor(
                                    event.event_type
                                    )}`}
                                >                       
                                {event.event_type}
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPolicyDecisionColor(
                          event.policy_decision
                        )}`}
                      >
                        {event.policy_decision}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {event.sensitivity_score !== null && event.sensitivity_score !== undefined ? (
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getSensitivityColor(
                                event.sensitivity_score
                              )}`}
                              style={{
                                width: `${event.sensitivity_score * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {(event.sensitivity_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {event.is_shadow_ai ? (
                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                      ) : (
                        <Shield className="w-5 h-5 text-green-600" />
                      )}
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
