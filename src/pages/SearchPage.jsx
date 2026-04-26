import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, SlidersHorizontal, User, MapPin, ChevronDown, ChevronUp, Phone, Map, Bell, Loader2 } from 'lucide-react'
import { searchMissingPersons } from '../firebase/missingPersons'
import { subscribeToPersonAlerts } from '../firebase/notifications'

const getConfig = (score) => {
  if (score > 85) return { label: 'High Match', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', action: 'Contact Rescue Team', actionStyle: 'bg-emerald-600 hover:bg-emerald-700 text-white' }
  if (score >= 60) return { label: 'Possible Match', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-400', action: 'Request More Info', actionStyle: 'bg-amber-100 hover:bg-amber-200 text-amber-800' }
  return { label: 'Low Match', color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', dot: 'bg-slate-400', action: 'Track Case', actionStyle: 'bg-slate-100 hover:bg-slate-200 text-slate-700' }
}

function MatchCard({ person, index }) {
  const [expanded, setExpanded] = useState(false)
  const [notified, setNotified] = useState(false)
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const cfg = getConfig(person.confidence ?? 0)

  const handleNotify = async () => {
    if (notified || notifyLoading) return
    const phone = window.prompt('Enter your phone number to receive an alert when this person is found:')
    if (!phone) return
    setNotifyLoading(true)
    try {
      await subscribeToPersonAlerts(person.id, phone)
      setNotified(true)
    } catch (err) {
      console.error('Notification error:', err)
      alert('Could not subscribe to alerts. Please try again.')
    } finally {
      setNotifyLoading(false)
    }
  }

  // Resolve nested location field from Firestore shape
  const lastSeen = person.lastKnownLocation?.description || person.lastSeen || 'Unknown'
  const district = person.lastKnownLocation?.district || person.district || '—'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={!expanded ? { scale: 1.01, boxShadow: '0 6px 24px rgba(0,0,0,0.05)' } : {}}
      className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all"
    >
      {/* Card Row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 text-left cursor-pointer"
      >
        {/* Photo */}
        <div className="w-14 h-14 rounded-full bg-[#1E3A8A]/6 border border-[#1E3A8A]/10 flex items-center justify-center shrink-0 overflow-hidden">
          {person.photoUrl
            ? <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
            : <User className="w-6 h-6 text-[#1E3A8A]/50" />
          }
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0" style={{ fontFamily: 'var(--font-body)' }}>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-[#0F172A]">{person.name}</h3>
            {person.age && <span className="text-sm text-[#475569]">Age {person.age}</span>}
            {person.gender && <span className="text-xs text-[#475569] bg-slate-100 px-2 py-0.5 rounded-full">{person.gender}</span>}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[#475569]">
            <MapPin className="w-3.5 h-3.5 opacity-60 shrink-0" />
            <span className="truncate">{lastSeen}</span>
          </div>
        </div>

        {/* Confidence + expand toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.border}`}>
            <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className={`text-xs font-bold ${cfg.color}`}>{person.confidence ?? '?'}%</span>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-gray-100"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <div className="p-5 space-y-4">
              <p className="text-sm text-[#475569] leading-relaxed">{person.description || 'No description available.'}</p>
              <p className="text-xs text-slate-400 font-medium">District: {district}</p>
              {person.refId && <p className="text-xs text-slate-400 font-mono">Ref: {person.refId}</p>}

              {/* Mini map placeholder */}
              <AnimatePresence>
                {showMap && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="h-36 bg-[#E0F2FE] rounded-xl flex items-center justify-center border border-[#1E3A8A]/10 overflow-hidden"
                  >
                    <div className="text-center text-[#475569]">
                      <Map className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-medium">Location: {lastSeen}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${cfg.actionStyle}`}>
                  <Phone className="w-3.5 h-3.5 inline mr-1.5" />
                  {cfg.action}
                </button>
                <button
                  onClick={() => setShowMap((v) => !v)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#1E3A8A]/8 hover:bg-[#1E3A8A]/15 text-[#1E3A8A] transition-colors"
                >
                  <Map className="w-3.5 h-3.5 inline mr-1.5" />
                  {showMap ? 'Hide' : 'Show'} Probable Location
                </button>
                <button
                  onClick={handleNotify}
                  disabled={notifyLoading}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    notified ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {notifyLoading
                    ? <Loader2 className="w-3.5 h-3.5 inline mr-1.5 animate-spin" />
                    : <Bell className="w-3.5 h-3.5 inline mr-1.5" />
                  }
                  {notified ? 'Notified ✓' : 'Notify Me'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({ age: '', district: '', gender: '' })
  const [searched, setSearched] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await searchMissingPersons(query, {
        district: filters.district,
        gender: filters.gender,
      })
      setResults(data)
      setSearched(true)
    } catch (err) {
      console.error('Search error:', err)
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [query, filters])

  return (
    <div className="min-h-screen pt-28 pb-20 px-5 max-w-3xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold text-[#0F172A] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Search for Someone</h1>
        <p className="text-[#475569] mb-8">Enter a name, description, or last known location to find a match.</p>

        {/* Search bar */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Name, location, or description..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 shadow-sm"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-[#1E3A8A] hover:bg-[#162D6B] text-white rounded-xl px-5 py-3 text-sm font-semibold transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`rounded-xl px-3.5 py-3 border text-sm transition-colors ${showFilters ? 'bg-[#1E3A8A]/8 border-[#1E3A8A]/20 text-[#1E3A8A]' : 'border-gray-200 bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden mb-5"
            >
              <div className="grid grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                  <label className="text-xs font-bold text-[#0F172A] block mb-1.5">Age</label>
                  <input
                    type="text" placeholder="e.g. 30"
                    value={filters.age}
                    onChange={(e) => setFilters((f) => ({ ...f, age: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#0F172A] block mb-1.5">District</label>
                  <input
                    type="text" placeholder="e.g. Kozhikode"
                    value={filters.district}
                    onChange={(e) => setFilters((f) => ({ ...f, district: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]/30"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#0F172A] block mb-1.5">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value }))}
                    className="w-full text-sm px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]/30"
                  >
                    <option value="">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{error}</p>
        )}

        {/* Results */}
        {searched && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-[#475569] font-medium">
              {results.length > 0 ? `${results.length} result${results.length > 1 ? 's' : ''} found` : 'No matches found. Try adjusting your search.'}
            </p>
            {results.map((person, i) => (
              <MatchCard key={person.id} person={person} index={i} />
            ))}
          </motion.div>
        )}

        {!searched && !loading && (
          <p className="text-center text-sm text-slate-400 mt-16">Enter a name or location above to begin searching.</p>
        )}
      </motion.div>
    </div>
  )
}
