import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Users, Clock, Maximize2, Minimize2, User } from 'lucide-react'

const priorityConfig = {
  CRITICAL: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30', badge: 'bg-red-500 text-white', dot: 'bg-red-500' },
  HIGH:     { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-400/30', badge: 'bg-orange-500 text-white', dot: 'bg-orange-400' },
  MEDIUM:   { bg: 'bg-yellow-500/10', text: 'text-yellow-700', border: 'border-yellow-400/30', badge: 'bg-yellow-400 text-yellow-900', dot: 'bg-yellow-400' },
}

export default function TaskCard({ task, index = 0 }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const cfg = priorityConfig[task.priority] || priorityConfig.MEDIUM
  const isOverdue = task.hoursAgo > 2
  const isCritical = task.priority === 'CRITICAL'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className={`
        rounded-xl border p-3.5 transition-colors select-none
        ${isOverdue ? 'border-red-400 bg-red-50/50 shadow-red-100' : 'border-slate-200/80 bg-white'}
        ${isCritical && !isOverdue ? 'border-l-[4px] border-l-red-500' : ''}
      `}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Header with Avatar */}
      <div className="flex gap-3 mb-3">
        {task.photoUrl ? (
          <img src={task.photoUrl} alt={task.name} className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200 shadow-sm" />
        ) : (
          <div className="w-11 h-11 rounded-full shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
            <User className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-1">
            <h4 className="text-[14px] font-bold text-slate-800 leading-tight truncate">{task.name}</h4>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide ${cfg.badge}`}>
              {task.priority}
            </span>
          </div>
          {task.description && (
             <p className={`text-[11px] text-slate-500 mt-1 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
               {task.description}
             </p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-600 mb-2">
        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span className="truncate font-medium">{task.location}</span>
      </div>

      {/* Team + Time */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
        <span className={`flex items-center gap-1.5 font-semibold ${isCritical ? 'text-red-600' : 'text-slate-500'}`}>
          <Users className="w-3.5 h-3.5 opacity-70" />
          {task.team}
        </span>
        <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-red-500 font-bold' : ''}`}>
          <Clock className="w-3.5 h-3.5 opacity-70" />
          {task.hoursAgo || 0}h ago
        </span>
      </div>

      {/* Expanded Info */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1 border-t border-slate-100 space-y-2 mt-2">
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">System Status</p>
                <p className="text-[12px] text-slate-700 font-medium">
                  {task.status === 'match' ? 'High-confidence AI match flagged.' : 'Active search pending new intelligence.'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-center border-t border-slate-100 pt-2.5 mt-1">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 px-3 py-1.5 rounded-lg transition-colors w-full justify-center"
        >
          {isExpanded ? (
            <><Minimize2 className="w-3.5 h-3.5" /> Collapse</>
          ) : (
            <><Maximize2 className="w-3.5 h-3.5" /> Expand</>
          )}
        </button>
      </div>
    </motion.div>
  )
}
