// ============================================================
// DisasterIQ — DevDataSeeder
// DEVELOPER TOOL ONLY — seeds mock found_persons records so the
// ML matching engine has candidates to score against.
// Remove this component before production deployment.
// ============================================================

import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { motion, AnimatePresence } from 'framer-motion'
import { FlaskConical, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'

// ── Mock records that conform to the ML API Pydantic PersonRecord schema ──
const MOCK_FOUND_PERSONS = [
  {
    name: 'Rajan Kumar',
    age: 34,
    gender: 'Male',
    physical_tags: ['blue jacket', 'medium build', 'short black hair', 'visible scar on left hand'],
    location: {
      description: 'Downtown Relief Center, Block C',
      latitude: 28.6139,
      longitude: 77.2090,
    },
    photo_url: null,
    notes: 'Found near the flood evacuation zone. Unresponsive to name calls initially.',
    status: 'found',
  },
  {
    name: 'Anjali Mehta',
    age: 28,
    gender: 'Female',
    physical_tags: ['red dupatta', 'slim build', 'long hair', 'gold earrings'],
    location: {
      description: 'Sector 4 Shelter, Room 12',
      latitude: 28.7041,
      longitude: 77.1025,
    },
    photo_url: null,
    notes: 'Brought in by rescue team Delta. Mild dehydration. Able to communicate.',
    status: 'found',
  },
  {
    name: 'Unknown Male',
    age: 50,
    gender: 'Male',
    physical_tags: ['grey beard', 'heavy build', 'torn white kurta', 'barefoot'],
    location: {
      description: 'Westside Clinic, Ward 3',
      latitude: 28.5355,
      longitude: 77.3910,
    },
    photo_url: null,
    notes: 'Identity unconfirmed. No documents found. Admitted with minor injuries.',
    status: 'found',
  },
]

export default function DevDataSeeder() {
  const [state, setState] = useState('idle') // 'idle' | 'loading' | 'done' | 'error'
  const [message, setMessage] = useState('')

  const seedData = async () => {
    setState('loading')
    setMessage('')
    try {
      const col = collection(db, 'found_persons')
      const writes = MOCK_FOUND_PERSONS.map((person) =>
        addDoc(col, { ...person, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      )
      await Promise.all(writes)
      setState('done')
      setMessage(`✓ ${MOCK_FOUND_PERSONS.length} mock found-person records written to Firestore.`)
    } catch (err) {
      console.error('[DevDataSeeder]', err)
      setState('error')
      setMessage(err?.message || 'Failed to seed data. Check Firestore rules & console.')
    }
  }

  const iconMap = {
    idle: <FlaskConical className="w-4 h-4" />,
    loading: <Loader2 className="w-4 h-4 animate-spin" />,
    done: <CheckCircle2 className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />,
  }

  const colorMap = {
    idle: 'bg-violet-600 hover:bg-violet-700 text-white',
    loading: 'bg-violet-400 text-white cursor-not-allowed',
    done: 'bg-emerald-600 text-white cursor-default',
    error: 'bg-red-500 text-white',
  }

  return (
    <section className="px-5 pb-12 max-w-6xl mx-auto">
      <div className="border border-dashed border-violet-300 bg-violet-50/60 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Label */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <FlaskConical className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="text-sm font-bold text-violet-700" style={{ fontFamily: 'var(--font-heading)' }}>
              Dev Tool — Seed Found Persons
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-200 text-violet-600 uppercase tracking-wide">
              Dev Only
            </span>
          </div>
          <p className="text-xs text-violet-600/80 pl-6" style={{ fontFamily: 'var(--font-body)' }}>
            Writes 3 mock records to <code className="font-mono bg-violet-100 px-1 rounded">found_persons</code> so the ML engine has candidates to score.
          </p>
        </div>

        {/* Button */}
        <motion.button
          whileHover={{ scale: state === 'idle' || state === 'error' ? 1.04 : 1 }}
          whileTap={{ scale: state === 'idle' || state === 'error' ? 0.97 : 1 }}
          onClick={state === 'idle' || state === 'error' ? seedData : undefined}
          disabled={state === 'loading' || state === 'done'}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${colorMap[state]}`}
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {iconMap[state]}
          {state === 'idle' && 'Seed Mock Data'}
          {state === 'loading' && 'Seeding…'}
          {state === 'done' && 'Data Seeded'}
          {state === 'error' && 'Retry Seed'}
        </motion.button>
      </div>

      {/* Status message */}
      <AnimatePresence>
        {message && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-2 text-xs px-4 ${state === 'error' ? 'text-red-600' : 'text-emerald-700'}`}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  )
}
