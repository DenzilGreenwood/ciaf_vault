import { Suspense } from 'react'
import { WebEventsTable } from '@/components/web/WebEventsTable'
import { Globe } from 'lucide-react'

export default function WebEventsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-8 h-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Web AI Governance Events
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Shadow AI detection, policy enforcement, and browser-based AI usage
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
        <WebEventsTable />
      </Suspense>
    </div>
  )
}
