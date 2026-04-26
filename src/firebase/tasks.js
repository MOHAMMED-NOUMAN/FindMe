// ============================================================
// DisasterIQ — Tasks Service
// Collection: tasks
// Powers the Rescue Dashboard Kanban board
// ============================================================

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  getDocs,
  limit,
} from 'firebase/firestore'
import { db } from './config'

const COL = 'tasks'

// ── Status constants matching TaskBoard columns ───────────────────────────
export const TASK_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  ENROUTE: 'enroute',
  ONSCENE: 'onscene',
  COMPLETED: 'completed',
}

export const TASK_PRIORITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
}

// ── Real-time task board listener ─────────────────────────────────────────
// Returns an unsubscribe function.
// `callback` receives { open:[], assigned:[], enroute:[], onscene:[], completed:[] }
export function subscribeTaskBoard(callback) {
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const grouped = {
      open: [],
      assigned: [],
      enroute: [],
      onscene: [],
      completed: [],
    }
    snap.docs.forEach((d) => {
      const task = { id: d.id, ...d.data() }
      const bucket = grouped[task.status] ?? grouped.open
      bucket.push(task)
    })
    callback(grouped)
  })
}

// ── Create a task (used by coordinators / auto-assign function) ───────────
export async function createTask(taskData) {
  const payload = {
    name: taskData.name || 'Unknown Person',
    priority: taskData.priority || TASK_PRIORITY.MEDIUM,
    location: taskData.location || '',
    district: taskData.district || null,
    team: taskData.team || 'Unassigned',
    status: TASK_STATUS.OPEN,
    missingPersonId: taskData.missingPersonId || null,  // link to missing_persons doc
    notes: taskData.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, COL), payload)
  return ref.id
}

// ── Update task status (drag-and-drop / button click) ────────────────────
export async function updateTaskStatus(taskId, newStatus) {
  await updateDoc(doc(db, COL, taskId), {
    status: newStatus,
    updatedAt: serverTimestamp(),
  })
}

// ── Auto-assign nearest available team (client-side, no Cloud Function) ──
export async function autoAssignTask(taskId) {
  const taskRef = doc(db, 'tasks', taskId)

  // Find an active team with no current task
  const teamsSnap = await getDocs(
    query(
      collection(db, 'teams'),
      where('status', '==', 'active'),
      where('currentTaskId', '==', null),
      limit(1)
    )
  )
  if (teamsSnap.empty) return { assigned: false, reason: 'No available teams' }

  const teamDoc = teamsSnap.docs[0]
  const teamName = teamDoc.data().name || teamDoc.id

  await updateDoc(taskRef, {
    team: teamName,
    status: TASK_STATUS.ASSIGNED,
    updatedAt: serverTimestamp(),
  })
  await updateDoc(teamDoc.ref, { currentTaskId: taskId })

  return { assigned: true, team: teamName }
}

// ── Delete a task ─────────────────────────────────────────────────────────
export async function deleteTask(taskId) {
  await deleteDoc(doc(db, COL, taskId))
}

// ── Live count of critical unresolved tasks (for SLA alert bar) ──────────
export function subscribeCriticalAlerts(callback) {
  const q = query(
    collection(db, COL),
    where('priority', '==', TASK_PRIORITY.CRITICAL),
    where('status', 'in', [TASK_STATUS.OPEN, TASK_STATUS.ASSIGNED])
  )
  return onSnapshot(q, (snap) => {
    callback(snap.size)
  })
}

// ── Live count of unassigned tasks ───────────────────────────────────────
export function subscribeUnassignedCount(callback) {
  const q = query(
    collection(db, COL),
    where('team', '==', 'Unassigned'),
    where('status', '==', TASK_STATUS.OPEN)
  )
  return onSnapshot(q, (snap) => callback(snap.size))
}
