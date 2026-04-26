import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, UserCheck, Siren, Timer } from 'lucide-react'
import { subscribeGlobalStats } from '../../firebase/stats'

export default function KPIBar() {
  const [stats, setStats] = useState({
    missing: 0,
    found: 0,
    activeRescues: 0,
    avgResolutionHours: null,
  })

  useEffect(() => {
    const unsub = subscribeGlobalStats((data) => setStats(data))
    return () => unsub()
  }, [])

  const kpis = [
    {
      label: 'Total Missing',
      value: stats.missing?.toLocaleString() ?? '—',
      icon: Users,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      trend: 'Live count',
    },
    {
      label: 'Total Found',
      value: stats.found?.toLocaleString() ?? '—',
      icon: UserCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
      trend: 'Live count',
    },
    {
      label: 'Active Rescues',
      value: stats.activeRescues?.toLocaleString() ?? '—',
      icon: Siren,
      color: 'text-blue-600',
      bg: 'bg-blue-500/10',
      trend: 'En route + on scene',
    },
    {
      label: 'Avg Resolution',
      value: stats.avgResolutionHours != null ? `${stats.avgResolutionHours}h` : '—',
      icon: Timer,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
      trend: 'Hours to resolve',
    },
  ]

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
