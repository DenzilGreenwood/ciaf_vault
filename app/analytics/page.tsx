import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="w-8 h-8 text-indigo-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Analytics & Insights
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Deep insights into AI lifecycle, shadow AI, and usage patterns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder cards for analytics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Model Lifecycle Pipeline
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Training → Deployment → Inference visualization
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Shadow AI Detection Trends
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Tools usage frequency over time
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Content Sensitivity Distribution
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Sensitivity scores over time
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Policy Effectiveness
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            Block vs Warn vs Allow rates
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Users & Departments
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            User behavior analysis
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Coming Soon:</strong> Advanced analytics with custom dashboards, 
          trend analysis, and predictive insights powered by CIAF data.
        </p>
      </div>
    </div>
  )
}
