import { Suspense } from 'react'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { EventStream } from '@/components/dashboard/EventStream'
import { EventTypeChart } from '@/components/dashboard/EventTypeChart'
import { TimelineChart } from '@/components/dashboard/TimelineChart'
import { Shield, Activity, AlertTriangle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Shield className="w-10 h-10 text-blue-600" />
            CIAF Vault
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            Single Source of Truth for AI Lifecycle Events
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-lg">
          <Activity className="w-5 h-5 text-green-600 dark:text-green-400 animate-pulse" />
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Live Monitoring Active
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded-lg" />}>
        <DashboardStats />
      </Suspense>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Stream - 2/3 width */}
        <div className="lg:col-span-2">
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
            <EventStream />
          </Suspense>
        </div>

        {/* Event Type Distribution - 1/3 width */}
        <div className="lg:col-span-1">
          <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
            <EventTypeChart />
          </Suspense>
        </div>
      </div>

      {/* Timeline Chart */}
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg" />}>
        <TimelineChart />
      </Suspense>

      {/* Alert Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200">
              Shadow AI Detection Active
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Monitoring unauthorized AI tool usage across your organization. 
              <span className="font-medium"> 3 new detections </span> in the last 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
