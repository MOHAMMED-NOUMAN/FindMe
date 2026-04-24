import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Tent, AlertTriangle } from 'lucide-react'

export default function AlertsBar() {
  return (
    <div className="px-5 max-w-6xl mx-auto mt-6" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="bg-[#1E3A8A] text-white text-sm py-2.5 px-5 flex items-center justify-center gap-2 font-medium rounded-xl shadow-sm">
        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
        <span>Kerala Floods</span>
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase">Critical</span>
        <span className="text-white/60 hidden sm:inline">— Stay informed. Help is on the way.</span>
      </div>

      <div className="mt-4 flex justify-center">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <button
            onClick={() => alert('Nearest camp: Kozhikode Town Hall — 2.3 km away')}
            className="inline-flex items-center gap-2.5 bg-[#1E3A8A] hover:bg-[#162D6B] text-white rounded-xl px-6 py-3 text-sm font-semibold transition-colors shadow-md shadow-[#1E3A8A]/20"
          >
            <Tent className="w-4 h-4" />
            Find Nearest Relief Camp
          </button>
        </motion.div>
      </div>
    </div>
  )
}
