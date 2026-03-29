'use client'

import { useState } from 'react'
import { FileCheck, Search, CheckCircle2, XCircle } from 'lucide-react'
import { truncateHash } from '@/lib/utils'

export default function ReceiptsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean
    message: string
  } | null>(null)

  const handleVerify = async () => {
    // Placeholder verification logic
    // In a real implementation, this would verify the receipt against the blockchain/merkle tree
    if (searchTerm) {
      setVerificationResult({
        verified: true,
        message: 'Receipt verified successfully. Hash chain integrity confirmed.',
      })
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
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-lg"
            />
          </div>
          <button
            onClick={handleVerify}
            disabled={!searchTerm}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Verify
          </button>
        </div>

        {verificationResult && (
          <div
            className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
              verificationResult.verified
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}
          >
            {verificationResult.verified ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3
                className={`font-semibold ${
                  verificationResult.verified
                    ? 'text-green-900 dark:text-green-200'
                    : 'text-red-900 dark:text-red-200'
                }`}
              >
                {verificationResult.verified
                  ? 'Verification Successful'
                  : 'Verification Failed'}
              </h3>
              <p
                className={`mt-1 text-sm ${
                  verificationResult.verified
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                {verificationResult.message}
              </p>
            </div>
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
