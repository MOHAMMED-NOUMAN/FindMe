import { motion } from 'framer-motion'
import { MapPin, Users, Clock, ArrowUpRight, RefreshCw, X } from 'lucide-react'

const priorityConfig = {
  CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30', badge: 'bg-red-500 text-white', dot: 'bg-red-500' },
  HIGH:     { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-400/30', badge: 'bg-orange-500 text-white', dot: 'bg-orange-400' },
  MEDIUM:   { bg: 'bg-yellow-500/10', text: 'text-yellow-700', border: 'border-yellow-400/30', badge: 'bg-yellow-400 text-yellow-900', dot: 'bg-yellow-400' },
}

export default function TaskCard({ task, index = 0 }) {
  const cfg = priorityConfig[task.priority] || priorityConfig.MEDIUM
  const isOverdue = task.hoursAgo > 2
  const isCritical = task.priority === 'CRITICAL'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      draggable
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      className={`
        rounded-lg border p-3 cursor-grab active:cursor-grabbing transition-colors select-none
        ${isOverdue ? 'border-red-400 bg-red-50/50 shadow-red-100' : 'border-slate-200/80 bg-white'}
        ${isCritical && !isOverdue ? 'border-l-[3px] border-l-red-500' : ''}
      `}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-[13px] font-bold text-slate-800 leading-tight truncate">{task.name}</h4>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wide ${cfg.badge}`}>
          {task.priority}
        </span>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1.5">
        <MapPin className="w-3 h-3 shrink-0 opacity-60" />
        <span className="truncate">{task.location}</span>
      </div>

      {/* Team + Time */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2.5">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3 opacity-60" />
          {task.team}
        </span>
        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
          <Clock className="w-3 h-3 opacity-60" />
          {task.hoursAgo}h ago
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-1 border-t border-slate-100 pt-2">
        <button className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 px-1.5 py-1 rounded-md transition-colors">
          <RefreshCw className="w-3 h-3" /> Reassign
        </button>
        <button className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-orange-600 hover:bg-orange-50 px-1.5 py-1 rounded-md transition-colors">
          <ArrowUpRight className="w-3 h-3" /> Escalate
        </button>
        <button className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 px-1.5 py-1 rounded-md transition-colors ml-auto">
          <X className="w-3 h-3" /> Close
        </button>
      </div>
    </motion.div>
  )
}
