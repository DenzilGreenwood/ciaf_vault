'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CoreEvent } from '@/lib/types'
import {
  formatTimestamp,
  getEventBadgeColor,
  getStageBadgeColor,
  truncateHash,
} from '@/lib/utils'
import { FileText, Search, Filter } from 'lucide-react'

export function CoreEventsTable() {
  const [events, setEvents] = useState<CoreEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStage, setFilterStage] = useState<string>('')
  const [filterEventType, setFilterEventType] = useState<string>('')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('events_core')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100)

      const { data, error } = await query

      if (error) throw error
      setEvents(data as any[])
    } catch (error) {
      console.error('Error fetching core events:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      !searchTerm ||
      event.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStage = !filterStage || event.stage === filterStage
    const matchesEventType =
      !filterEventType || event.event_type === filterEventType

    return matchesSearch && matchesStage && matchesEventType
  })

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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search model name or event ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Stages</option>
            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((stage) => (
              <option key={stage} value={stage}>
                Stage {stage}
              </option>
            ))}
          </select>
          <select
            value={filterEventType}
            onChange={(e) => setFilterEventType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Event Types</option>
            <option value="training">Training</option>
            <option value="inference">Inference</option>
            <option value="deployment">Deployment</option>
            <option value="monitoring">Monitoring</option>
          </select>
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
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Event Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Stage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Content Hash
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Receipt
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
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
                      {event.model_name}
                    </div>
                    {event.model_version && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        v{event.model_version}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventBadgeColor(
                        event.event_type
                      )}`}
                    >
                      {event.event_type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStageBadgeColor(
                            event.stage
                        )}`}
                        >
                        {event.stage}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-500 dark:text-gray-400">
                    {event.content_hash ? truncateHash(event.content_hash, 6) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {event.receipt_id ? (
                      <FileText className="w-4 h-4 text-green-600" />
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
