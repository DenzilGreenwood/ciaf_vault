import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimestamp(timestamp: string): string {
  return format(new Date(timestamp), 'PPpp')
}

export function formatRelativeTime(timestamp: string): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

export function getEventBadgeColor(eventType: string): string {
  const colors: Record<string, string> = {
    training: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    inference: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    deployment: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    monitoring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    tool_detected: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    content_submitted: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    policy_violation: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return colors[eventType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

export function getPolicyDecisionColor(decision: string): string {
  const colors: Record<string, string> = {
    allow: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    block: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return colors[decision] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

export function getStageBadgeColor(stage: string): string {
  const stageColors: Record<string, string> = {
    A: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
    B: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    C: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    D: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    E: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    F: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    G: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    H: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return stageColors[stage] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
}

export function getSensitivityColor(score: number): string {
  if (score >= 0.8) return 'bg-red-500'
  if (score >= 0.6) return 'bg-orange-500'
  if (score >= 0.4) return 'bg-yellow-500'
  if (score >= 0.2) return 'bg-blue-500'
  return 'bg-green-500'
}

export function truncateHash(hash: string, length: number = 8): string {
  if (!hash) return ''
  return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`
}

export function generateEventId(prefix: string = 'evt'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function calculateComplianceScore(
  compliant: number,
  total: number
): number {
  if (total === 0) return 100
  return Math.round((compliant / total) * 100)
}
