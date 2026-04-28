import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, User, MapPin, Loader2, SearchX, X,
  RefreshCw, Camera, CheckCircle2, AlertCircle, Scan,
  ChevronDown, ChevronUp, Activity
} from 'lucide-react'
import { collection, getDocs, query, orderBy, limit, doc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase/config'
import { callMLMatchingAPI, callMLFaceMatchAPI, checkMLHealth } from '../services/mlService'

// ── Data adapter ─────────────────────────────────────────────
function toPersonRecord(id, data) {
  let location = null
  const lat = parseFloat(data.location?.latitude ?? data.lastKnownLocation?.latitude)
  const lng = parseFloat(data.location?.longitude ?? data.lastKnownLocation?.longitude)
  if (!isNaN(lat) && !isNaN(lng)) {
    location = { latitude: lat, longitude: lng }
  }

  const locDesc =
    data.location?.description ||
    data.lastKnownLocation?.description ||
    data.location?.district ||
    data.lastKnownLocation?.district ||
    null

  let physical_tags = []
  if (Array.isArray(data.physicalTags)) {
    physical_tags = data.physicalTags
  } else if (Array.isArray(data.physical_tags)) {
    physical_tags = data.physical_tags
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
    photo_url: data.photoUrl || data.photo_url || null,
    ai_match_confirmed: data.ai_match_confirmed || false,
    dismissed_found_ids: data.dismissed_found_ids || [],
  }
}

// ── Score colour helpers ──────────────────────────────────────
function getMatchConfig(score) {
  const pct = Math.round(score * 100)
  if (pct > 85) return {
    pct,
    label: 'High Confidence',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    bar: 'bg-emerald-500',
    action: 'Verify Now',
    buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    dot: 'bg-emerald-500',
  }
  if (pct >= 60) return {
    pct,
    label: 'Possible Match',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    bar: 'bg-amber-500',
    action: 'Review',
    buttonBg: 'bg-amber-100 hover:bg-amber-200 text-amber-700',
    dot: 'bg-amber-500',
  }
  return {
    pct,
    label: 'Low Signal',
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    bar: 'bg-slate-400',
    action: 'Track',
    buttonBg: 'bg-slate-100 hover:bg-slate-200 text-slate-600',
    dot: 'bg-slate-400',
  }
}

// ── Score bar sub-component ───────────────────────────────────
function ScoreBar({ label, value, color = 'bg-[#1E3A8A]' }) {
  const pct = Math.round((value ?? 0) * 100)
  return (
    <div>
      <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  )
}

// ── Loading state ─────────────────────────────────────────────
function AnalyzingState() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-[#1E3A8A]/10 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-[#1E3A8A]" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-[#1E3A8A]/30 animate-ping" />
      </div>
      <div className="text-center">
        <p className="text-[#0F172A] font-semibold text-base" style={{ fontFamily: 'var(--font-heading)' }}>
          Running AI Analysis…
        </p>
        <p className="text-[#475569] text-xs mt-1">
          Comparing missing & found records via ML engine.
        </p>
      </div>
    </div>
  )
}

// ── Face verification pill ─────────────────────────────────────
function FaceVerifyButton({ url1, url2 }) {
  const [state, setState] = useState('idle') // idle | loading | result | error
  const [result, setResult] = useState(null)
  const [errMsg, setErrMsg] = useState('')

  const canCompare = url1 && url2

  async function handleVerify() {
    setState('loading')
    setResult(null)
    try {
      const data = await callMLFaceMatchAPI(url1, url2)
      setResult(data)
      setState('result')
    } catch (e) {
      setErrMsg(e.message)
      setState('error')
    }
  }

  if (!canCompare) return (
    <div className="flex items-center gap-2 text-xs text-slate-400 italic">
      <Camera className="w-4 h-4" /> No photos available for face comparison
    </div>
  )

  if (state === 'idle') return (
    <button
      onClick={handleVerify}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#1E3A8A]/10 hover:bg-[#1E3A8A]/20 text-[#1E3A8A] transition-colors"
    >
      <Scan className="w-4 h-4" /> Run Face Verification
    </button>
  )

  if (state === 'loading') return (
    <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-500">
      <Loader2 className="w-4 h-4 animate-spin" /> Comparing faces…
    </div>
  )

  if (state === 'error') return (
    <div className="flex items-center gap-2 text-xs text-red-600">
      <AlertCircle className="w-4 h-4" /> {errMsg}
    </div>
  )

  // result state
  const { is_match, similarity_percentage, face_distance } = result
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold ${is_match ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
      }`}>
      {is_match
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertCircle className="w-4 h-4 shrink-0" />
      }
      <span>
        Face {is_match ? 'Match' : 'Mismatch'} — {similarity_percentage?.toFixed(1)}% similarity
        <span className="ml-2 font-normal text-xs opacity-70">(distance: {face_distance?.toFixed(3)})</span>
      </span>
      <button
        onClick={() => setState('idle')}
        className="ml-auto text-xs opacity-60 hover:opacity-100"
      >
        Reset
      </button>
    </div>
  )
}

// ── Comparison modal ───────────────────────────────────────────
function ComparisonModal({ match, onClose, onConfirm, onDismiss }) {
  const { foundPerson, missingPerson, score, breakdown } = match
  const pct = Math.round(score * 100)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm(missingPerson.id, foundPerson.id, score)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setIsConfirming(false)
    }
  }

  const PersonDetail = ({ person, title }) => (
    <div className="flex-1 bg-slate-50 rounded-xl p-5 border border-slate-100">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">{title}</h4>
      <div className="flex flex-col items-center mb-5">
        <div className="w-24 h-24 rounded-full bg-slate-200 overflow-hidden mb-3 border-2 border-white shadow-sm">
          {person?.photo_url ? (
            <img src={person.photo_url} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#1E3A8A]/5 text-[#1E3A8A]/40">
              <User className="w-10 h-10" />
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-[#0F172A] text-center">{person?.name || 'Unknown'}</h3>
        <p className="text-sm text-slate-500 mt-1">
          {person?.age ? `${person.age} yrs` : '?'} · {person?.gender || '—'}
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Location</div>
          <div className="text-sm text-slate-700 flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>{person?.location_desc || 'Location unknown'}</span>
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Physical Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {person?.physical_tags?.length > 0 ? (
              person.physical_tags.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-xs text-slate-600">
                  {tag}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-400 italic">No tags</span>
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E3A8A]/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#1E3A8A]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]" style={{ fontFamily: 'var(--font-heading)' }}>
                AI Match Comparison
              </h2>
              <p className="text-xs text-slate-400">{pct}% composite confidence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Composite Score</span>
            <button
              onClick={() => setShowBreakdown(v => !v)}
              className="text-[11px] text-[#1E3A8A] font-semibold flex items-center gap-1"
            >
              {showBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showBreakdown ? 'Hide' : 'Show'} Breakdown
            </button>
          </div>
          <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${pct > 85 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-slate-400'}`}
            />
          </div>

          <AnimatePresence>
            {showBreakdown && breakdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pb-1">
                  <ScoreBar label="Name (40%)" value={breakdown.name_score} color="bg-[#1E3A8A]" />
                  <ScoreBar label="Age (20%)" value={breakdown.age_score} color="bg-violet-500" />
                  <ScoreBar label="Location (25%)" value={breakdown.location_score} color="bg-cyan-500" />
                  <ScoreBar label="Tags (15%)" value={breakdown.tag_score} color="bg-orange-400" />
                </div>
                {breakdown.estimated_distance_km != null && (
                  <p className="text-[11px] text-slate-400 mt-2">
                    Estimated distance: <strong>{breakdown.estimated_distance_km?.toFixed(1)} km</strong>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Person cards */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-col md:flex-row gap-5">
            <PersonDetail person={foundPerson} title="Found Person" />
            <div className="hidden md:flex flex-col items-center justify-center text-slate-200 gap-2 shrink-0">
              <div className="w-px h-12 bg-slate-200" />
              <Sparkles className="w-4 h-4 text-slate-300" />
              <div className="w-px h-12 bg-slate-200" />
            </div>
            <PersonDetail person={missingPerson} title="Missing Report" />
          </div>
        </div>

        {/* Face verification */}
        <div className="px-6 pb-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Face Verification</div>
          <FaceVerifyButton url1={foundPerson?.photo_url} url2={missingPerson?.photo_url} />
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onDismiss}
            disabled={isConfirming}
            className="px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-auto disabled:opacity-50"
          >
            Dismiss Match
          </button>
          <button onClick={onClose} disabled={isConfirming} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 disabled:opacity-50">
            Close
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#1E3A8A] text-white hover:bg-[#162D6B] transition-colors shadow-sm disabled:opacity-50"
          >
            {isConfirming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirm Match
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Match card ─────────────────────────────────────────────────
function MatchCard({ matchData, index, onSelect }) {
  const { foundPerson, missingPerson, score } = matchData
  const config = getMatchConfig(score)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className="flex items-center gap-4 bg-white rounded-xl px-4 py-3.5 shadow-sm border border-slate-100 hover:border-[#1E3A8A]/20 hover:shadow-md transition-all group"
    >
      {/* Avatars stacked */}
      <div className="relative w-10 h-10 shrink-0">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-100">
          {foundPerson?.photo_url
            ? <img src={foundPerson.photo_url} alt={foundPerson.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><User className="w-4 h-4 text-slate-400" /></div>
          }
        </div>
        <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow-sm bg-slate-100 absolute -bottom-1.5 -right-1.5">
          {missingPerson?.photo_url
            ? <img src={missingPerson.photo_url} alt={missingPerson.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><User className="w-3 h-3 text-slate-400" /></div>
          }
        </div>
      </div>

      {/* Names */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-[#0F172A] truncate">{foundPerson?.name || 'Unknown'}</span>
          <span className="text-slate-300 text-xs">→</span>
          <span className="text-sm font-semibold text-[#1E3A8A] truncate">{missingPerson?.name || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {foundPerson?.age && <span className="text-[11px] text-slate-400">Age {foundPerson.age}</span>}
          {foundPerson?.location_desc && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3" />{foundPerson.location_desc}
            </span>
          )}
        </div>
      </div>

      {/* Score badge + button */}
      <div className="flex items-center gap-3 shrink-0">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-bold ${config.bg} ${config.border} ${config.color}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
          {config.pct}%
        </div>
        <button
          onClick={() => onSelect(matchData)}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${config.buttonBg}`}
        >
          {config.action}
        </button>
      </div>
    </motion.div>
  )
}

// ── API Health indicator ───────────────────────────────────────
function MLHealthBadge() {
  const [status, setStatus] = useState('checking') // checking | ok | error

  useEffect(() => {
    checkMLHealth()
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${status === 'ok'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
      : status === 'error'
        ? 'bg-red-50 border-red-200 text-red-600'
        : 'bg-slate-50 border-slate-200 text-slate-500'
      }`}>
      <Activity className="w-3 h-3" />
      {status === 'ok' ? 'ML Engine Online' : status === 'error' ? 'ML Engine Offline' : 'Checking…'}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function AIMatchResults() {
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState([])
  const [error, setError] = useState(null)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [runCount, setRunCount] = useState(0)

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const missingSnap = await getDocs(
        query(collection(db, 'missing_persons'), orderBy('createdAt', 'desc'), limit(500))
      )
      const foundSnap = await getDocs(
        query(collection(db, 'found_persons'), orderBy('createdAt', 'desc'), limit(500))
      )

      if (missingSnap.empty || foundSnap.empty) {
        setMatches([])
        setLoading(false)
        return
      }

      const missingList = missingSnap.docs
        .map(d => toPersonRecord(d.id, d.data()))
        .filter(p => !p.ai_match_confirmed)
      const foundList = foundSnap.docs.map(d => toPersonRecord(d.id, d.data()))

      const allMatches = []

      for (const foundPerson of foundList) {
        try {
          const response = await callMLMatchingAPI(foundPerson, missingList)
          if (response?.matches) {
            for (const match of response.matches) {
              if (match.composite_score >= 0.60) {
                const mPerson = missingList.find(m => m.id === match.missing_person_id)
                // Filter out if this specific pair was dismissed
                if (mPerson && !mPerson.dismissed_found_ids.includes(foundPerson.id)) {
                  allMatches.push({
                    foundPerson,
                    missingPerson: mPerson,
                    score: match.composite_score,
                    breakdown: {
                      name_score: match.name_score,
                      age_score: match.age_score,
                      location_score: match.location_score,
                      tag_score: match.tag_score,
                      estimated_distance_km: match.estimated_distance_km,
                    },
                  })
                }
              }
            }
          }
        } catch (apiErr) {
          console.warn('[AIMatchResults] API error for foundPerson', foundPerson.id, apiErr)
        }
      }

      allMatches.sort((a, b) => b.score - a.score)
      setMatches(allMatches.slice(0, 15))
    } catch (err) {
      console.error('[AIMatchResults]', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [runCount]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let mounted = true
    runAnalysis().then(() => { if (!mounted) return }).catch(() => { })
    return () => { mounted = false }
  }, [runCount]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => setRunCount(c => c + 1)

  const handleConfirmMatch = async (missingId, foundId, score) => {
    // Write the match to Firestore so it appears in the Potential Match column
    await updateDoc(doc(db, "missing_persons", missingId), {
      found_person_id: foundId,
      composite_score: score,
      ai_match_confirmed: true,
      updatedAt: serverTimestamp()
    })

    // Remove it from the local AI match list so the UI updates
    setMatches(prev => prev.filter(m => m.missingPerson.id !== missingId))
  }

  const handleDismissMatch = async (missingId, foundId) => {
    // Mark this specific pair as dismissed
    await updateDoc(doc(db, "missing_persons", missingId), {
      dismissed_found_ids: arrayUnion(foundId),
      updatedAt: serverTimestamp()
    })
    setMatches(prev => prev.filter(m => !(m.missingPerson.id === missingId && m.foundPerson.id === foundId)))
  }

  return (
    <div className="space-y-3" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1E3A8A]" />
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-[0.14em]" style={{ fontFamily: 'var(--font-heading)' }}>
            AI Match Engine
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <MLHealthBadge />
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#1E3A8A] border border-[#1E3A8A]/20 hover:bg-[#1E3A8A]/5 disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analysing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <AnalyzingState />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>AI analysis failed: {error}</span>
        </div>
      ) : matches.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-12 gap-3 text-center"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <SearchX className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-[#0F172A]">No matches found</p>
          <p className="text-xs text-slate-500 max-w-xs">
            The AI engine didn't find high-confidence links between recent found & missing records.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-500 px-1">{matches.length} potential match{matches.length !== 1 ? 'es' : ''} found</p>
          <AnimatePresence>
            {matches.map((match, i) => (
              <MatchCard
                key={`${match.foundPerson.id}-${match.missingPerson.id}`}
                matchData={match}
                index={i}
                onSelect={setSelectedMatch}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Comparison modal */}
      <AnimatePresence>
        {selectedMatch && (
          <ComparisonModal
            match={selectedMatch}
            onClose={() => setSelectedMatch(null)}
            onConfirm={handleConfirmMatch}
            onDismiss={() => {
              handleDismissMatch(selectedMatch.missingPerson.id, selectedMatch.foundPerson.id)
              setSelectedMatch(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
