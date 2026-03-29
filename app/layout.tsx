import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CIAF Vault - AI Lifecycle Observability',
  description: 'Single Source of Truth for CIAF AI Lifecycle Events - Cognitive Insight™ Audit Framework',
  keywords: ['CIAF', 'AI Governance', 'LCM', 'Audit Trail', 'AI Observability'],
  authors: [{ name: 'Denzil James Greenwood', url: 'https://cognitiveinsight.ai' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-gray-200 dark:border-gray-800 mt-auto py-6">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>© 2025 Denzil James Greenwood | Cognitive Insight™ | LCM™</p>
              <p className="mt-1">Licensed under BUSL-1.1 | Contact: Founder@cognitiveinsight.ai</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
