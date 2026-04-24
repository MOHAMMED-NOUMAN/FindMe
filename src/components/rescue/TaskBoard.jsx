import { motion } from 'framer-motion'
import TaskCard from './TaskCard'

const columns = [
  { id: 'open', label: 'Open', color: 'bg-slate-400' },
  { id: 'assigned', label: 'Assigned', color: 'bg-blue-500' },
  { id: 'enroute', label: 'En Route', color: 'bg-amber-500' },
  { id: 'onscene', label: 'On Scene', color: 'bg-emerald-500' },
  { id: 'completed', label: 'Completed', color: 'bg-slate-300' },
]

const mockTasks = {
  open: [
    { id: 1, name: 'Priya Nair', priority: 'CRITICAL', location: 'Wayanad, Sector 3', team: 'Unassigned', hoursAgo: 3.5 },
    { id: 2, name: 'Mohammed Fasil', priority: 'HIGH', location: 'Kozhikode Bridge', team: 'Unassigned', hoursAgo: 1.2 },
    { id: 3, name: 'Lakshmi Devi', priority: 'MEDIUM', location: 'Malappuram South', team: 'Unassigned', hoursAgo: 0.5 },
  ],
  assigned: [
    { id: 4, name: 'Rajan Pillai', priority: 'CRITICAL', location: 'Calicut Riverbank', team: 'Alpha-7', hoursAgo: 2.8 },
    { id: 5, name: 'Aisha Begum', priority: 'HIGH', location: 'Wayanad Relief Rd', team: 'Bravo-3', hoursAgo: 1.0 },
  ],
  enroute: [
    { id: 6, name: 'Thomas Kurian', priority: 'HIGH', location: 'Sector 5, Hilltop', team: 'Delta-1', hoursAgo: 0.8 },
  ],
  onscene: [
    { id: 7, name: 'Deepa Menon', priority: 'CRITICAL', location: 'Flood Zone A', team: 'Alpha-2', hoursAgo: 4.1 },
    { id: 8, name: 'Suresh Kumar', priority: 'MEDIUM', location: 'Town Hall Camp', team: 'Charlie-4', hoursAgo: 1.5 },
  ],
  completed: [
    { id: 9, name: 'Anita George', priority: 'HIGH', location: 'Sector 2 School', team: 'Bravo-1', hoursAgo: 6 },
  ],
}

export default function TaskBoard() {
  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Task Board</h2>
        <span className="text-[11px] text-slate-400 font-medium">
          {Object.values(mockTasks).flat().length} total tasks
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {columns.map((col, ci) => {
          const tasks = mockTasks[col.id] || []
          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.05 }}
              className="min-w-[220px] w-[220px] shrink-0 flex flex-col"
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-xs font-bold text-slate-600">{col.label}</span>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5">
                  {tasks.length}
                </span>
              </div>

              {/* Cards container */}
              <div
                className="flex-1 bg-slate-50/60 rounded-lg border border-dashed border-slate-200 p-1.5 space-y-1.5 min-h-[120px] max-h-[340px] overflow-y-auto"
                onDragOver={(e) => e.preventDefault()}
              >
                {tasks.length === 0 && (
                  <div className="text-center py-6 text-[11px] text-slate-300 font-medium">
                    No tasks
                  </div>
                )}
                {tasks.map((task, i) => (
                  <TaskCard key={task.id} task={task} index={i} />
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
