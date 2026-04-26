import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, UserX } from 'lucide-react'
import CommandMap from '../components/rescue/CommandMap'
import TaskBoard from '../components/rescue/TaskBoard'
import KPIBar from '../components/rescue/KPIBar'
import { subscribeCriticalAlerts, subscribeUnassignedCount } from '../firebase/tasks'

export default function RescueDashboard() {
  const [criticalCount, setCriticalCount] = useState(0)
  const [unassignedCount, setUnassignedCount] = useState(0)

  useEffect(() => {
    const unsubCrit = subscribeCriticalAlerts(setCriticalCount)
    const unsubUnassigned = subscribeUnassignedCount(setUnassignedCount)
    return () => { unsubCrit(); unsubUnassigned() }
  }, [])

  const slaAlerts = [
    criticalCount > 0
      ? { id: 1, text: `${criticalCount} critical task${criticalCount > 1 ? 's' : ''} pending`, severity: 'critical' }
      : null,
    unassignedCount > 0
      ? { id: 2, text: `${unassignedCount} unassigned case${unassignedCount > 1 ? 's' : ''}`, severity: 'warning' }
      : null,
  ].filter(Boolean)

  return (
    <div className="h-screen flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Spacer below fixed navbar */}
      <div className="shrink-0 h-[96px]" />

      {/* Main split layout */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANEL — DATA + TASKS ──────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-[40%] shrink-0 border-r border-slate-200/60 bg-[#F8FAFC] flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

            {/* Quick Stats */}
            <KPIBar />

            {/* SLA / Alert Indicators */}
            {slaAlerts.length > 0 && (
              <div className="flex gap-2">
                {slaAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-semibold ${
                      alert.severity === 'critical'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}
                  >
                    {alert.severity === 'critical'
                      ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      : <UserX className="w-3.5 h-3.5 shrink-0" />
                    }
                    {alert.text}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Task Board (Kanban) */}
            <TaskBoard />
          </div>
        </motion.div>

        {/* ── RIGHT PANEL — COMMAND MAP ──────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <CommandMap />
        </motion.div>

      </div>
    </div>
  )
}
