import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, User, MapPin } from 'lucide-react'

const initialMatches = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    age: 34,
    location: 'Downtown Relief Center',
    description: 'Found wearing a blue jacket, matches description of missing person.',
    confidence: 92
  },
  {
    id: 2,
    name: 'Unknown Male',
    age: 'Approx. 40',
    location: 'Sector 4 Shelter',
    description: 'Brought in yesterday. Matches height and general appearance.',
    confidence: 78
  },
  {
    id: 3,
    name: 'Emma Smith',
    age: 28,
    location: 'Westside Clinic',
    description: 'Similar name matching, but different physical description.',
    confidence: 45
  }
]

export default function AIMatchResults() {
  const [matches, setMatches] = useState([])

  // Simulate loading data and sorting
  useEffect(() => {
    const timer = setTimeout(() => {
      const sorted = [...initialMatches].sort((a, b) => b.confidence - a.confidence)
      setMatches(sorted)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const getMatchConfig = (score) => {
    if (score > 85) {
      return {
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        action: 'Verify Now',
        buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white'
      }
    }
    if (score >= 60) {
      return {
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        action: 'Request Info',
        buttonBg: 'bg-amber-100 hover:bg-amber-200 text-amber-700'
      }
    }
    return {
      color: 'text-slate-500',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      action: 'Track',
      buttonBg: 'bg-slate-100 hover:bg-slate-200 text-slate-600'
    }
  }

  return (
    <section className="px-5 pb-24 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="bg-[#E0F2FE]/40 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-sm border border-[#1E3A8A]/10"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-[#1E3A8A]" />
              <h2 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: 'var(--font-heading)' }}>
                AI Match Results
              </h2>
            </div>
            <p className="text-[#475569] text-sm" style={{ fontFamily: 'var(--font-body)' }}>
              Ranked results based on similarity and probability
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {matches.map((match, index) => {
              const config = getMatchConfig(match.confidence)
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.015, boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}
                  className="flex flex-col md:flex-row items-start md:items-center gap-5 bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-all cursor-default"
                >
                  {/* Left: Profile Image Placeholder */}
                  <div className="w-14 h-14 shrink-0 rounded-full bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-[#1E3A8A]/60" />
                  </div>

                  {/* Center: Details */}
                  <div className="flex-1 min-w-0" style={{ fontFamily: 'var(--font-body)' }}>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-[#0F172A] truncate">
                        {match.name}
                      </h3>
                      <span className="text-sm font-medium text-[#475569]">
                        Age {match.age}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[#475569] mb-2">
                      <MapPin className="w-4 h-4 opacity-70" />
                      <span className="truncate">{match.location}</span>
                    </div>
                    <p className="text-sm text-[#475569] leading-relaxed">
                      {match.description}
                    </p>
                  </div>

                  {/* Right: Score & Action */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 mt-2 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100 shrink-0">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.border}`}>
                      <div className={`w-2 h-2 rounded-full bg-current ${config.color}`} />
                      <span className={`text-sm font-bold ${config.color}`} style={{ fontFamily: 'var(--font-body)' }}>
                        {match.confidence}% Match
                      </span>
                    </div>
                    <button
                      className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${config.buttonBg}`}
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      {config.action}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {matches.length === 0 && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-pulse flex gap-2 items-center text-[#475569]">
                <Sparkles className="w-5 h-5" />
                <span style={{ fontFamily: 'var(--font-body)' }}>Calculating matches...</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  )
}
