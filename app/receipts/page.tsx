'use client'

import { useState } from 'react'
import { FileCheck, Search, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import { truncateHash } from '@/lib/utils'

interface VerificationResult {
  verified: boolean
  receipt: any
  checks: {
    receipt_exists: boolean
    content_hash_valid: boolean
    merkle_root_valid: boolean
    signature_valid: boolean
    event_exists: boolean
    event_hash_matches: boolean
  }
  details: string[]
  errors: string[]
}

export default function ReceiptsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleVerify = async () => {
    if (!searchTerm) return

    setLoading(true)
    setError(null)
    setVerificationResult(null)

    try {
      const response = await fetch('/api/receipts/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receipt_id: searchTerm.startsWith('rcpt_') ? searchTerm : undefined,
          event_id: searchTerm.startsWith('evt_') ? searchTerm : undefined,
        }),
      })

      const result = await response.json()

      if (result.success && result.data) {
        setVerificationResult(result.data)
      } else {
        setError(result.error || 'Verification failed')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify receipt')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileCheck className="w-8 h-8 text-teal-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Receipt Verification
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Verify cryptographic receipts and audit trail integrity
          </p>
        </div>
      </div>

      {/* Search & Verify */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Verify Receipt
</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter a receipt ID (rcpt_...) or event ID (evt_...) to verify cryptographic integrity
        </p>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Enter receipt ID or event ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setVerificationResult(null)
                setError(null)
              }}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg"
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={!searchTerm || loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-200">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {verificationResult && (
          <div
            className={`mt-6 p-6 rounded-lg border-2 ${
              verificationResult.verified
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600'
                : 'bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600'
            }`}
          >
            <div className="flex items-start gap-3 mb-4">
              {verificationResult.verified ? (
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
              )}
              <div>
                <h3
                  className={`text-xl font-bold ${
                    verificationResult.verified
                      ? 'text-green-900 dark:text-green-200'
                      : 'text-red-900 dark:text-red-200'
                  }`}
                >
                  {verificationResult.verified
                    ? '✓ Receipt Verified'
                    : '✗ Verification Failed'}
                </h3>
                <p
                  className={`mt-1 text-sm ${
                    verificationResult.verified
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {verificationResult.verified
                    ? 'All cryptographic checks passed'
                    : 'One or more checks failed'}
                </p>
              </div>
            </div>

            {/* Checks */}
            <div className="space-y-2 mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                Verification Checks:
              </h4>
              {Object.entries(verificationResult.checks).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 text-sm">
                  {value ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
              ))}
            </div>

            {/* Details */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                Details:
              </h4>
              <div className="space-y-1">
                {verificationResult.details.map((detail, i) => (
                  <p key={i} className="text-sm text-gray-700 dark:text-gray-300">
                    {detail}
                  </p>
                ))}
              </div>
            </div>

            {/* Errors */}
            {verificationResult.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-200 text-sm mb-2">
                  Errors:
                </h4>
                <div className="space-y-1">
                  {verificationResult.errors.map((error, i) => (
                    <p key={i} className="text-sm text-red-700 dark:text-red-300">
                      • {error}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Receipt Details */}
            {verificationResult.receipt && (
              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                  Receipt Information:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Receipt ID:</span>
                    <span className="ml-2 font-mono text-gray-900 dark:text-white">
                      {verificationResult.receipt.receipt_id}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Event ID:</span>
                    <span className="ml-2 font-mono text-gray-900 dark:text-white">
                      {verificationResult.receipt.event_id}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Content Hash:</span>
                    <span className="ml-2 font-mono text-gray-900 dark:text-white break-all">
                      {verificationResult.receipt.content_hash}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Merkle Root:</span>
                    <span className="ml-2 font-mono text-gray-900 dark:text-white break-all">
                      {verificationResult.receipt.merkle_root}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Receipt Details (sample) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Receipt Details
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Receipt ID
              </label>
              <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                {searchTerm || 'rcpt_1234567890_abc123'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Event ID
              </label>
              <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                evt_core_1234567890_def456
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Content Hash
              </label>
              <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                {truncateHash('abc123def456ghi789jkl012mno345pqr678', 12)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Merkle Root
              </label>
              <p className="mt-1 text-sm font-mono text-gray-900 dark:text-white">
                {truncateHash('xyz987uvw654rst321opq098nml765ihg432', 12)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Chain Sequence
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">42</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Signature Algorithm
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">ed25519</p>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Download Receipt (JSON)
            </button>
          </div>
        </div>
      </div>

      {/* Merkle Proof Visualization (placeholder) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Merkle Proof Chain
        </h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <FileCheck className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p>Merkle proof visualization will appear here</p>
            <p className="text-sm mt-2">
              Visual representation of hash chain and proof verification
            </p>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
          About CIAF Receipts
        </h3>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          Every CIAF event can generate a cryptographic receipt with hash chains and Merkle proofs,
          ensuring tamper-proof audit trails. Receipts use ed25519 signatures and are verifiable
          independently of the CIAF Vault database.
        </p>
      </div>
    </div>
  )
}
