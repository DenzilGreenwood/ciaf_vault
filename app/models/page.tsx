import { Suspense } from 'react'
import { CoreEventsTable } from '@/components/models/CoreEventsTable'
import { Cpu } from 'lucide-react'

export default function ModelsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Cpu className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Model Lifecycle Events
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Training, inference, deployment, and monitoring events
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
        <CoreEventsTable />
      </Suspense>
    </div>
  )
}
