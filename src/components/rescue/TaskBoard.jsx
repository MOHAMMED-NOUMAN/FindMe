import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import TaskCard from './TaskCard'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../../firebase/config'

export default function TaskBoard() {
  const [missingPersons, setMissingPersons] = useState([])

  useEffect(() => {
    // Fetch directly from missing_persons to show all missing people!
    const q = query(
      collection(db, 'missing_persons'),
      where('status', '==', 'missing'),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMissingPersons(data)
    })
    return () => unsub()
  }, [])

  // Group into two columns: Missing (No Match) and High Confidence (Has Match)
  const columns = [
    { id: 'missing', label: 'Missing', color: 'bg-red-500' },
    { id: 'match', label: 'Potential Match', color: 'bg-amber-500' },
  ]

  const grouped = {
    missing: [],
    match: []
  }

  missingPersons.forEach(mp => {
    // Determine column based on composite_score or found_person_id
    const isMatch = mp.composite_score >= 0.40 || mp.found_person_id != null
    const bucket = isMatch ? grouped.match : grouped.missing

    // Synthesize a task object so TaskCard can render it without changes
    const synthesizedTask = {
      id: mp.id,
      name: mp.name || 'Unknown',
      photoUrl: mp.photoUrl || null,
      description: mp.description || (mp.physicalTags ? mp.physicalTags.join(', ') : null),
      priority: 'HIGH', 
      location: mp.lastKnownLocation?.description || mp.lastKnownLocation?.district || 'Location Unknown',
      team: 'AI Match Pending',
      hoursAgo: mp.createdAt?.toMillis ? Math.floor((Date.now() - mp.createdAt.toMillis()) / 3600000) : 0,
      status: isMatch ? 'match' : 'missing'
    }

    if (isMatch) {
      synthesizedTask.priority = 'CRITICAL'
      synthesizedTask.team = 'Match Found!'
    }

    bucket.push(synthesizedTask)
  })

  return (
    <div style={{ fontFamily: 'var(--font-body)' }} className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Live Search Board</h2>
        <span className="text-[11px] text-slate-400 font-medium">
          {missingPersons.length} missing person{missingPersons.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 flex-1">
        {columns.map((col, ci) => {
          const colTasks = grouped[col.id] || []
          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.05 }}
              className="flex-1 min-w-[280px] max-w-[400px] flex flex-col"
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <span className="text-xs font-bold text-slate-600">{col.label}</span>
                <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards container */}
              <div className="flex-1 bg-slate-50/60 rounded-xl border border-slate-200 p-2 space-y-2 overflow-y-auto transition-colors shadow-inner">
                {colTasks.length === 0 && (
                  <div className="text-center py-10 text-[12px] text-slate-400 font-medium">
                    No people in this category
                  </div>
                )}
                {colTasks.map((task, i) => (
                  <div key={task.id}>
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
