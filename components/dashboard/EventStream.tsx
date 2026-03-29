'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime, getEventBadgeColor, getStageBadgeColor, truncateHash } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

type CombinedEvent = {
  id: string
  event_id: string
  timestamp: string
  type: 'core' | 'web'
  title: string
  subtitle: string
  badge: string
  stage?: string
  hash?: string
}

export function EventStream() {
  const [events, setEvents] = useState<CombinedEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
    subscribeToEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      // Fetch core events
      const { data: coreData } = await supabase
        .from('events_core')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50)

      // Fetch web events
      const { data: webData } = await supabase
        .from('events_web')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50)

      // Combine and sort
      const combined: CombinedEvent[] = [
        ...(coreData || []).map((e) => ({
          id: e.id,
          event_id: e.event_id,
          timestamp: e.timestamp,
          type: 'core' as const,
          title: e.model_name,
          subtitle: e.model_version || '',
          badge: e.event_type,
          stage: e.stage,
          hash: e.content_hash || undefined,
        })),
        ...(webData || []).map((e) => ({
          id: e.id,
          event_id: e.event_id,
          timestamp: e.timestamp,
          type: 'web' as const,
          title: e.tool_name,
          subtitle: `${e.user_id} @ ${e.org_id}`,
          badge: e.event_type,
          hash: e.content_hash || undefined,
        })),
      ]

      combined.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setEvents(combined.slice(0, 100))
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToEvents = () => {
    // Subscribe to core events
    const coreChannel = supabase
      .channel('core-events')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'events_core' },
        (payload) => {
          const newEvent: CombinedEvent = {
            id: payload.new.id,
            event_id: payload.new.event_id,
            timestamp: payload.new.timestamp,
            type: 'core',
            title: payload.new.model_name,
            subtitle: payload.new.model_version || '',
            badge: payload.new.event_type,
            stage: payload.new.stage,
            hash: payload.new.content_hash || undefined,
          }
          setEvents((prev) => [newEvent, ...prev].slice(0, 100))
        }
      )
      .subscribe()

    // Subscribe to web events
    const webChannel = supabase
      .channel('web-events')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'events_web' },
        (payload) => {
          const newEvent: CombinedEvent = {
            id: payload.new.id,
            event_id: payload.new.event_id,
            timestamp: payload.new.timestamp,
            type: 'web',
            title: payload.new.tool_name,
            subtitle: `${payload.new.user_id} @ ${payload.new.org_id}`,
            badge: payload.new.event_type,
            hash: payload.new.content_hash || undefined,
          }
          setEvents((prev) => [newEvent, ...prev].slice(0, 100))
        }
      )
      .subscribe()

    return () => {
      coreChannel.unsubscribe()
      webChannel.unsubscribe()
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Live Event Stream
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Real-time CIAF events across all sources
        </p>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No events yet. Events will appear here in real-time.
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventBadgeColor(event.badge)}`}>
                      {event.badge}
                    </span>
                    {event.stage && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStageBadgeColor(event.stage)}`}>
                        Stage {event.stage}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${event.type === 'core' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
                      {event.type}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {event.subtitle}
                  </p>
                  {event.hash && (
                    <p className="mt-1 text-xs font-mono text-gray-400 dark:text-gray-500">
                      {truncateHash(event.hash)}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(event.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
