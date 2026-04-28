// ============================================================
// DisasterIQ — Statistics Service
// Collection: stats (aggregated, updated by Cloud Functions)
// Also provides real-time counters for QuickStats & KPIBar
// ============================================================

import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore'
import { db } from './config'

const STATS_DOC = 'stats/global'

// ── Real-time global stats listener ──────────────────────────────────────
// The `stats/global` document is maintained by the Cloud Function
// `onMissingPersonWrite` which increments/decrements counts atomically.
// Shape: { missing, found, campsOpen, teamsActive, activeRescues, avgResolutionHours }
export function subscribeGlobalStats(callback) {
  return onSnapshot(doc(db, 'stats', 'global'), (snap) => {
    if (snap.exists()) {
      callback(snap.data())
    } else {
      // Fallback: compute from collections directly (slower but safe)
      computeStats().then(callback)
    }
  })
}

// ── Fallback: compute stats on demand ────────────────────────────────────
async function computeStats() {
  const [missingSnap, foundSnap, rescuesSnap, campsSnap] = await Promise.all([
    getCountFromServer(
      query(collection(db, 'missing_persons'), where('status', '==', 'missing'))
    ),
    getCountFromServer(
      query(collection(db, 'missing_persons'), where('status', '==', 'found'))
    ),
    getCountFromServer(
      query(collection(db, 'tasks'), where('status', 'in', ['enroute', 'onscene']))
    ),
    getCountFromServer(
      query(collection(db, 'camps'), where('status', '==', 'active'))
    ),
  ])

  return {
    missing: missingSnap.data().count,
    found: foundSnap.data().count,
    campsOpen: campsSnap.data().count,
    teamsActive: 0,
    activeRescues: rescuesSnap.data().count,
    avgResolutionHours: null,
  }
}

// ── Camps listener ────────────────────────────────────────────────────────
export function subscribeCampsCount(callback) {
  const q = query(collection(db, 'camps'), where('status', '==', 'active'))
  return onSnapshot(q, (snap) => callback(snap.size))
}

// ── Teams listener ────────────────────────────────────────────────────────
export function subscribeTeamsCount(callback) {
  const q = query(collection(db, 'teams'), where('status', '==', 'active'))
  return onSnapshot(q, (snap) => callback(snap.size))
}
