'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, subDays, startOfDay } from 'date-fns'

type TimelineData = {
  date: string
  core: number
  web: number
}

export function TimelineChart() {
  const [data, setData] = useState<TimelineData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimelineData()
  }, [])

  const fetchTimelineData = async () => {
    try {
      const days = 7
      const today = startOfDay(new Date())
      const startDate = subDays(today, days)

      // Fetch core events
      const { data: coreData } = await supabase
        .from('events_core')
        .select('timestamp')
        .gte('timestamp', startDate.toISOString())

      // Fetch web events
      const { data: webData } = await supabase
        .from('events_web')
        .select('timestamp')
        .gte('timestamp', startDate.toISOString())

      // Group by date
      const dateMap: Record<
        string,
        { core: number; web: number }
      > = {}

      // Initialize all dates
      for (let i = days; i >= 0; i--) {
        const date = format(subDays(today, i), 'MMM dd')
        dateMap[date] = { core: 0, web: 0 }
      }

      // Count core events
      ;(coreData || []).forEach((item) => {
        const date = format(new Date(item.timestamp), 'MMM dd')
        if (dateMap[date]) {
          dateMap[date].core++
        }
      })

      // Count web events
      ;(webData || []).forEach((item) => {
        const date = format(new Date(item.timestamp), 'MMM dd')
        if (dateMap[date]) {
          dateMap[date].web++
        }
      })

      // Convert to array
      const chartData: TimelineData[] = Object.entries(dateMap).map(
        ([date, counts]) => ({
          date,
          ...counts,
        })
      )

      setData(chartData)
    } catch (error) {
      console.error('Error fetching timeline data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse h-64" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Event Timeline (Last 7 Days)
      </h2>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No timeline data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="core"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Core Events"
            />
            <Line
              type="monotone"
              dataKey="web"
              stroke="#10b981"
              strokeWidth={2}
              name="Web Events"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
