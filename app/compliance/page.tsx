import { Suspense } from 'react'
import { ComplianceDashboard } from '@/components/compliance/ComplianceDashboard'
import { ShieldCheck } from 'lucide-react'

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-purple-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Compliance Dashboard
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            GDPR, HIPAA, SOC2, and regulatory compliance tracking
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-96 rounded-lg" />}>
        <ComplianceDashboard />
      </Suspense>
    </div>
  )
}
