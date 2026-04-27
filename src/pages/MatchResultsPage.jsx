// ============================================================
// DisasterIQ — Match Results Page
// Shown immediately after a report is submitted. Passes the
// Firestore document ID to AIMatchResults so it can subscribe
// to live updates from the ML engine.
// ============================================================

import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import AIMatchResults from '../components/AIMatchResults'

export default function MatchResultsPage() {
  const { reportId } = useParams()

  return (
    <div className="min-h-screen pt-28 pb-12" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="max-w-6xl mx-auto px-5 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#475569] hover:text-[#1E3A8A] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1
            className="text-3xl font-bold text-[#0F172A] mb-1"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            ML Match Analysis
          </h1>
          <p className="text-[#475569] text-sm">
            Live results from the FindMe matching engine. This page updates automatically.
          </p>
        </motion.div>
      </div>

      {/* The core component — receives the report ID and subscribes to Firestore */}
      <AIMatchResults reportId={reportId} />
    </div>
  )
}
