import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, PenTool, Layers, MapPin, UserCheck, Shield, Tent, Flame } from 'lucide-react'
import MapControls from './MapControls'

const mapLayers = [
  { id: 'missing', label: 'Missing Persons', icon: MapPin, color: 'bg-red-500', dotColor: 'bg-red-400' },
  { id: 'found', label: 'Found Persons', icon: UserCheck, color: 'bg-emerald-500', dotColor: 'bg-emerald-400' },
  { id: 'teams', label: 'Rescue Teams', icon: Shield, color: 'bg-blue-500', dotColor: 'bg-blue-400' },
  { id: 'camps', label: 'Relief Camps', icon: Tent, color: 'bg-orange-500', dotColor: 'bg-orange-400' },
  { id: 'heatmap', label: 'Probability Heatmap', icon: Flame, color: 'bg-purple-500', dotColor: 'bg-purple-400' },
]

/* Fake map markers for visual realism */
const fakeMarkers = [
  { x: 25, y: 30, type: 'missing', pulse: true },
  { x: 40, y: 55, type: 'missing', pulse: true },
  { x: 60, y: 20, type: 'found', pulse: false },
  { x: 72, y: 45, type: 'teams', pulse: true },
  { x: 35, y: 70, type: 'teams', pulse: true },
  { x: 55, y: 65, type: 'camps', pulse: false },
  { x: 18, y: 50, type: 'camps', pulse: false },
  { x: 80, y: 35, type: 'missing', pulse: true },
  { x: 48, y: 40, type: 'found', pulse: false },
]

const markerColors = {
  missing: 'bg-red-500',
  found: 'bg-emerald-500',
  teams: 'bg-blue-500',
  camps: 'bg-orange-500',
}

export default function CommandMap() {
  const [activeLayers, setActiveLayers] = useState(['missing', 'found', 'teams', 'camps'])
  const [showLegend, setShowLegend] = useState(true)

  const toggleLayer = (id) => {
    setActiveLayers((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ fontFamily: 'var(--font-body)' }}>

      {/* Top filter bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white/60 backdrop-blur-sm border-b border-slate-200/60">
        <MapControls />
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowLegend((v) => !v)}
            className={`h-7 flex items-center gap-1.5 text-[11px] font-semibold rounded-lg px-2.5 border transition-colors ${showLegend ? 'bg-[#1E3A8A]/5 border-[#1E3A8A]/20 text-[#1E3A8A]' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            <Layers className="w-3.5 h-3.5" /> Layers
          </button>
          <button className="h-7 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 rounded-lg px-2.5 border border-slate-200 transition-colors">
            <PenTool className="w-3.5 h-3.5" /> Draw Zone
          </button>
          <button className="h-7 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 rounded-lg px-2.5 border border-slate-200 transition-colors">
            <Maximize2 className="w-3.5 h-3.5" /> Full Screen
          </button>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-[#E0F2FE] via-[#DBEAFE] to-[#C7D2FE]">

        {/* Simulated grid lines for map feel */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1E3A8A" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Simulated terrain patches */}
        <div className="absolute inset-0">
          <div className="absolute w-48 h-48 bg-emerald-300/15 rounded-full blur-3xl top-[15%] left-[20%]" />
          <div className="absolute w-64 h-64 bg-blue-300/20 rounded-full blur-3xl top-[40%] left-[50%]" />
          <div className="absolute w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl top-[60%] left-[10%]" />
          <div className="absolute w-56 h-56 bg-teal-300/10 rounded-full blur-3xl top-[20%] left-[65%]" />
        </div>

        {/* Simulated river */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 10 15 Q 30 25 25 45 Q 20 65 40 80 Q 50 90 60 95" fill="none" stroke="#3B82F6" strokeWidth="0.8" strokeLinecap="round" />
          <path d="M 65 5 Q 55 20 60 35 Q 65 50 50 60" fill="none" stroke="#3B82F6" strokeWidth="0.5" strokeLinecap="round" />
        </svg>

        {/* Simulated road */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 5 50 L 95 50" fill="none" stroke="#475569" strokeWidth="0.4" strokeDasharray="2,1" />
          <path d="M 50 5 L 50 95" fill="none" stroke="#475569" strokeWidth="0.4" strokeDasharray="2,1" />
        </svg>

        {/* Heatmap overlay */}
        <AnimatePresence>
          {activeLayers.includes('heatmap') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <div className="absolute w-44 h-44 bg-red-500/20 rounded-full blur-3xl top-[20%] left-[20%]" />
              <div className="absolute w-56 h-56 bg-red-400/15 rounded-full blur-3xl top-[35%] left-[55%]" />
              <div className="absolute w-36 h-36 bg-orange-400/20 rounded-full blur-3xl top-[55%] left-[30%]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fake markers */}
        {fakeMarkers
          .filter((m) => activeLayers.includes(m.type))
          .map((m, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
              className="absolute"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
            >
              <div className="relative">
                <div className={`w-3 h-3 rounded-full ${markerColors[m.type]} shadow-lg`} />
                {m.pulse && (
                  <div className={`absolute inset-0 w-3 h-3 rounded-full ${markerColors[m.type]} animate-ping opacity-40`} />
                )}
              </div>
            </motion.div>
          ))}

        {/* Title overlay */}
        <div className="absolute top-4 left-4">
          <div className="bg-white/80 backdrop-blur-md rounded-xl px-4 py-2 border border-slate-200/60 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800">Command Map</h2>
            <p className="text-[10px] text-slate-500">Kerala — Live Operations View</p>
          </div>
        </div>

        {/* Coordinates overlay */}
        <div className="absolute bottom-3 right-3">
          <div className="bg-black/40 backdrop-blur-sm rounded-md px-2 py-1">
            <span className="text-[10px] font-mono text-white/80">11.2588° N, 75.7804° E</span>
          </div>
        </div>

        {/* Layer legend */}
        <AnimatePresence>
          {showLegend && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/60 shadow-sm p-3 space-y-1.5"
            >
              {mapLayers.map((layer) => {
                const isActive = activeLayers.includes(layer.id)
                return (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`flex items-center gap-2 w-full px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      isActive
                        ? 'text-slate-700'
                        : 'text-slate-400 opacity-60'
                    } hover:bg-slate-50`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isActive ? layer.dotColor : 'bg-slate-300'}`} />
                    {layer.label}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
