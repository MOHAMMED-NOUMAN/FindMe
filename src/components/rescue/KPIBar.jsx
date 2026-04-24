import { motion } from 'framer-motion'
import { Users, UserCheck, Siren, Timer } from 'lucide-react'

const kpis = [
  { label: 'Total Missing', value: '1,204', icon: Users, color: 'text-red-500', bg: 'bg-red-500/10', trend: '+12 today' },
  { label: 'Total Found', value: '847', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-500/10', trend: '+38 today' },
  { label: 'Active Rescues', value: '56', icon: Siren, color: 'text-blue-600', bg: 'bg-blue-500/10', trend: '8 en route' },
  { label: 'Avg Resolution', value: '4.2h', icon: Timer, color: 'text-amber-600', bg: 'bg-amber-500/10', trend: '↓ 0.3h' },
]

export default function KPIBar() {
  return (
    <div className="grid grid-cols-4 gap-2" style={{ fontFamily: 'var(--font-body)' }}>
      {kpis.map((k, i) => (
        <motion.div
          key={k.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="bg-white border border-slate-200/60 rounded-xl p-3 flex items-center gap-3"
        >
          <div className={`p-2 rounded-lg ${k.bg} ${k.color} shrink-0`}>
            <k.icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-800 leading-tight">{k.value}</div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{k.label}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{k.trend}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
