import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, User, MapPin, Loader2, SearchX, X } from 'lucide-react'
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase/config'
import { callMLMatchingAPI } from '../services/mlService'

function toPersonRecord(id, data) {
  let location = null
  const lat = parseFloat(data.location?.latitude ?? data.lastKnownLocation?.latitude)
  const lng = parseFloat(data.location?.longitude ?? data.lastKnownLocation?.longitude)
  if (!isNaN(lat) && !isNaN(lng)) {
    location = { latitude: lat, longitude: lng }
  }
  
  const locDesc = data.location?.description || data.lastKnownLocation?.description || data.location?.district || data.lastKnownLocation?.district || null;

  let physical_tags = []
  if (Array.isArray(data.physicalTags)) {
    physical_tags = data.physicalTags
  } else if (typeof data.description === 'string' && data.description.trim()) {
    physical_tags = data.description.split(',').map(s => s.trim()).filter(Boolean)
  }

  return {
    id,
    name: data.name || null,
    age: parseInt(data.age) || null,
    gender: data.gender || null,
    location,
    location_desc: locDesc,
    physical_tags,
    photo_url: data.photoUrl || null,
  }
}

function getMatchConfig(score) {
  const pct = Math.round(score * 100)
  if (pct > 85) {
    return {
      pct, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', action: 'Verify Now', buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white'
    }
  }
  if (pct >= 60) {
    return {
      pct, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', action: 'Request Info', buttonBg: 'bg-amber-100 hover:bg-amber-200 text-amber-700'
    }
  }
  return {
    pct, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', action: 'Track', buttonBg: 'bg-slate-100 hover:bg-slate-200 text-slate-600'
  }
}

function AnalyzingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-[#1E3A8A]" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-[#1E3A8A]/30 animate-ping" />
      </div>
      <div className="text-center">
        <p className="text-[#0F172A] font-semibold text-base" style={{ fontFamily: 'var(--font-heading)' }}>
          Running AI Analysis...
        </p>
        <p className="text-[#475569] text-sm mt-1" style={{ fontFamily: 'var(--font-body)' }}>
          Comparing latest missing and found records via FastAPI backend.
        </p>
      </div>
    </div>
  )
}

function ComparisonModal({ match, onClose }) {
  const { foundPerson, missingPerson, score } = match
  const pct = Math.round(score * 100)
  
  const PersonDetail = ({ person, title }) => (
    <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100">
      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">{title}</h4>
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden mb-3 border-2 border-white shadow-sm">
          {person?.photo_url ? (
            <img src={person.photo_url} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#1E3A8A]/5 text-[#1E3A8A]/40">
              <User className="w-10 h-10" />
            </div>
          )}
        </div>
        <h3 className="text-xl font-bold text-[#0F172A] text-center">{person?.name || 'Unknown'}</h3>
        <p className="text-sm text-slate-500 mt-1">
          {person?.age ? `${person.age} years` : 'Age unknown'} • {person?.gender || 'Gender unknown'}
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase mb-1">Location</div>
          <div className="text-sm text-slate-700 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>{person?.location_desc || 'Location unknown'}</span>
          </div>
        </div>
        
        <div>
          <div className="text-xs text-slate-400 font-semibold uppercase mb-1">Physical Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {person?.physical_tags?.length > 0 ? (
              person.physical_tags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-md text-xs text-slate-600">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500 italic">No tags provided</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-[#0F172A]" style={{ fontFamily: 'var(--font-heading)' }}>Match Comparison</h2>
            <div className="px-3 py-1 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] text-sm font-bold">
              {pct}% Confidence
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="flex flex-col md:flex-row gap-6">
            <PersonDetail person={foundPerson} title="Found Person" />
            <div className="hidden md:flex flex-col items-center justify-center text-slate-300 gap-2 shrink-0">
              <div className="w-px h-16 bg-slate-200"></div>
              <Sparkles className="w-5 h-5" />
              <div className="w-px h-16 bg-slate-200"></div>
            </div>
            <PersonDetail person={missingPerson} title="Missing Report" />
          </div>
        </div>
        
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
            Close
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#1E3A8A] text-white hover:bg-[#162D6B] transition-colors shadow-sm">
            Confirm Match
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function MatchCard({ matchData, index, onSelect }) {
  const { foundPerson, missingPerson, score } = matchData
  const config = getMatchConfig(score)
  const location = foundPerson?.location_desc || 'Location unknown'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="flex flex-col xl:flex-row items-start xl:items-center gap-5 bg-white rounded-xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md"
    >
      <div className="w-14 h-14 shrink-0 rounded-full bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 flex items-center justify-center">
        {foundPerson?.photo_url ? (
          <img src={foundPerson.photo_url} alt={foundPerson.name} className="w-full h-full object-cover rounded-full" />
        ) : (
          <User className="w-6 h-6 text-[#1E3A8A]/60" />
        )}
      </div>

      <div className="flex-1 min-w-0" style={{ fontFamily: 'var(--font-body)' }}>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Found Person</div>
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-lg font-bold text-[#0F172A] truncate">
            {foundPerson?.name || 'Unknown Individual'}
          </h3>
          {foundPerson?.age && <span className="text-sm font-medium text-[#475569]">Age {foundPerson.age}</span>}
          {foundPerson?.gender && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{foundPerson.gender}</span>}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-[#475569] mb-2">
          <MapPin className="w-4 h-4 opacity-70" />
          <span className="truncate">{location}</span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-2">
          <span className="text-xs text-slate-500">Matched against Missing Report:</span>
          <span className="text-sm font-semibold text-[#1E3A8A]">{missingPerson?.name || 'Unknown'}</span>
        </div>
      </div>

      <div className="flex flex-row xl:flex-col items-center xl:items-end justify-between w-full xl:w-auto gap-4 mt-2 xl:mt-0 pt-4 xl:pt-0 border-t xl:border-t-0 border-gray-100 shrink-0">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${config.bg} ${config.border}`}>
          <div className={`w-2 h-2 rounded-full bg-current ${config.color}`} />
          <span className={`text-sm font-bold ${config.color}`} style={{ fontFamily: 'var(--font-body)' }}>
            {config.pct}% Match
          </span>
        </div>
        <button 
          onClick={() => onSelect(matchData)}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${config.buttonBg} cursor-pointer`} style={{ fontFamily: 'var(--font-body)' }}>
          {config.action}
        </button>
      </div>
    </motion.div>
  )
}

export default function AIMatchResults() {
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState([])
  const [error, setError] = useState(null)
  const [selectedMatch, setSelectedMatch] = useState(null)

  useEffect(() => {
    let mounted = true

    async function runAnalysis() {
      try {
        setLoading(true)
        setError(null)

        const missingSnap = await getDocs(query(collection(db, 'missing_persons'), orderBy('createdAt', 'desc'), limit(50)))
        const foundSnap = await getDocs(query(collection(db, 'found_persons'), orderBy('createdAt', 'desc'), limit(50)))

        if (missingSnap.empty || foundSnap.empty) {
          if (mounted) {
            setMatches([])
            setLoading(false)
          }
          return
        }

        const missingList = missingSnap.docs.map(d => toPersonRecord(d.id, d.data()))
        const foundList = foundSnap.docs.map(d => toPersonRecord(d.id, d.data()))

        const allMatches = []

        // In this implementation, we run the API for each found person against all missing persons.
        for (const foundPerson of foundList) {
          try {
            const response = await callMLMatchingAPI(foundPerson, missingList)
            if (response && response.matches) {
              for (const match of response.matches) {
                if (match.composite_score >= 0.20) { // lowering threshold slightly for display in dashboard
                  const mPerson = missingList.find(m => m.id === match.missing_person_id)
                  allMatches.push({
                    foundPerson,
                    missingPerson: mPerson,
                    score: match.composite_score
                  })
                }
              }
            }
          } catch (apiErr) {
            console.warn('API error for found person', foundPerson.id, apiErr)
          }
        }

        // Sort globally by score
        allMatches.sort((a, b) => b.score - a.score)

        if (mounted) {
          setMatches(allMatches.slice(0, 10)) // top 10 matches
          setLoading(false)
        }
      } catch (err) {
        console.error(err)
        if (mounted) {
          setError(err.message)
          setLoading(false)
        }
      }
    }

    runAnalysis()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <AnalyzingState />
      </div>
    )
  }

  return (
    <div className="bg-[#E0F2FE]/30 rounded-2xl p-5 shadow-sm border border-[#1E3A8A]/10 mt-4 mb-8">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-[#1E3A8A]" />
        <h2 className="text-xl font-bold text-[#0F172A]" style={{ fontFamily: 'var(--font-heading)' }}>
          AI Global Match Results
        </h2>
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          Failed to run AI analysis: {error}
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {matches.length > 0 ? (
            matches.map((match, i) => (
              <MatchCard key={`${match.foundPerson.id}-${match.missingPerson.id}`} matchData={match} index={i} onSelect={setSelectedMatch} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-10 gap-3 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <SearchX className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-[#0F172A] font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
                No strong matches
              </p>
              <p className="text-[#475569] text-xs max-w-xs" style={{ fontFamily: 'var(--font-body)' }}>
                The AI analysis didn't find any high-confidence links between recent found records and missing reports.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedMatch && (
          <ComparisonModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
