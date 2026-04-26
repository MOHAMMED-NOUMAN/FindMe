import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import TaskCard from './TaskCard'
import { subscribeTaskBoard, updateTaskStatus, TASK_STATUS } from '../../firebase/tasks'

const columns = [
  { id: 'open', label: 'Open', color: 'bg-slate-400' },
  { id: 'assigned', label: 'Assigned', color: 'bg-blue-500' },
  { id: 'enroute', label: 'En Route', color: 'bg-amber-500' },
  { id: 'onscene', label: 'On Scene', color: 'bg-emerald-500' },
  { id: 'completed', label: 'Completed', color: 'bg-slate-300' },
]

export default function TaskBoard() {
  const [tasks, setTasks] = useState({
    open: [], assigned: [], enroute: [], onscene: [], completed: [],
  })
  const [dragging, setDragging] = useState(null)

  useEffect(() => {
    const unsub = subscribeTaskBoard((grouped) => setTasks(grouped))
    return () => unsub()
  }, [])

  const totalCount = Object.values(tasks).flat().length

  // Drag-and-drop handlers
  const handleDragStart = (e, task) => {
    setDragging(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDrop = async (e, columnId) => {
    e.preventDefault()
    if (!dragging || dragging.status === columnId) return
    try {
      await updateTaskStatus(dragging.id, columnId)
    } catch (err) {
      console.error('Task move error:', err)
    }
    setDragging(null)
  }

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Task Board</h2>
        <span className="text-[11px] text-slate-400 font-medium">
          {totalCount} total task{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {columns.map((col, ci) => {
          const colTasks = tasks[col.id] || []
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
                  {colTasks.length}
                </span>
              </div>

              {/* Cards container (drop zone) */}
              <div
                className="flex-1 bg-slate-50/60 rounded-lg border border-dashed border-slate-200 p-1.5 space-y-1.5 min-h-[120px] max-h-[340px] overflow-y-auto transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {colTasks.length === 0 && (
                  <div className="text-center py-6 text-[11px] text-slate-300 font-medium">
                    No tasks
                  </div>
                )}
                {colTasks.map((task, i) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <TaskCard task={task} index={i} />
                  </div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
