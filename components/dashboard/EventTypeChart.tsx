'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

type EventTypeData = {
  name: string
  value: number
  color: string
  percentage?: number
}

const COLORS = {
  training: '#9fb5da',
  inference: '#10b981',
  deployment: '#8b5cf6',
  monitoring: '#f59e0b',
  tool_detected: '#f97316',
  content_submitted: '#1fbbb3',
  policy_violation: '#e8eb44',
  blocked: '#dc2626',
}

export function EventTypeChart() {
  const [data, setData] = useState<EventTypeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEventTypes()
  }, [])

  const fetchEventTypes = async () => {
    try {
      // Fetch core event types
      const { data: coreData } = await supabase
        .from('events_core')
        .select('event_type')

      // Fetch web event types
      const { data: webData } = await supabase
        .from('events_web')
        .select('event_type')

      // Count occurrences
      const counts: Record<string, number> = {}

      ;[...(coreData || []), ...(webData || [])].forEach((item) => {
        counts[item.event_type] = (counts[item.event_type] || 0) + 1
      })

      // Convert to chart data with calculated percentages
      const total = Object.values(counts).reduce((sum, val) => sum + val, 0)
      const chartData: EventTypeData[] = Object.entries(counts).map(
        ([name, value]) => ({
          name,
          value,
          color: COLORS[name as keyof typeof COLORS] || '#6b7280',
          percentage: total > 0 ? (value / total) * 100 : 0,
        })
      )

      // Apply largest remainder method to ensure percentages sum to 100
      const roundedPercentages = largestRemainderRound(
        chartData.map(d => d.percentage || 0)
      )
      
      chartData.forEach((item, index) => {
        item.percentage = roundedPercentages[index]
      })

      setData(chartData)
    } catch (error) {
      console.error('Error fetching event types:', error)
    } finally {
      setLoading(false)
    }
  }

  // Largest remainder method for rounding percentages to sum to 100
  const largestRemainderRound = (percentages: number[]): number[] => {
    const rounded = percentages.map(p => Math.floor(p))
    const remainders = percentages.map((p, i) => ({ index: i, remainder: p - rounded[i] }))
    remainders.sort((a, b) => b.remainder - a.remainder)
    
    let diff = 100 - rounded.reduce((sum, val) => sum + val, 0)
    for (let i = 0; i < diff; i++) {
      rounded[remainders[i].index]++
    }
    
    return rounded
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse h-80" />
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="flex text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Event Distribution
      </h2>
      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-gray-500">
          No event data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
                const RADIAN = Math.PI / 180
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                const x = cx + radius * Math.cos(-midAngle * RADIAN)
                const y = cy + radius * Math.sin(-midAngle * RADIAN)
                
                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="font-semibold text-sm"
                  >
                    {`${percentage}%`}
                  </text>
                )
              }}
              outerRadius={110}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [`${value} events`, name]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
