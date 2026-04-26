// ============================================================
// DisasterIQ — Missing Persons Service
// No Cloud Functions — all logic runs client-side on Firestore
// ============================================================

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  increment,
} from 'firebase/firestore'
import { db, auth } from './config'
import { ensureAnonymousAuth } from './authService'

const COL = 'missing_persons'

// ── Generate a human-readable reference ID (e.g. FM-A3B9C1) ─────────────
export function generateRefId() {
  return 'FM-' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

// ── Levenshtein distance for fuzzy name matching ──────────────────────────
function levenshtein(a, b) {
  if (!a || !b) return 99
  a = a.toLowerCase(); b = b.toLowerCase()
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1]
        ? dp[i-1][j-1]
        : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])
  return dp[m][n]
}

// ── Check for possible duplicate reports (replaces deduplicateReport CF) ──
// Returns up to 5 existing records with similar names.
export async function checkDuplicates(name) {
  if (!name || name.length < 3) return []
  const snap = await getDocs(
    query(collection(db, COL), where('status', '==', 'missing'), limit(200))
  )
  const matches = []
  snap.forEach((d) => {
    const data = d.data()
    if (levenshtein(name, data.name || '') <= 3) {
      matches.push({
        id: d.id,
        name: data.name,
        district: data.lastKnownLocation?.district,
        age: data.age,
      })
    }
  })
  return matches.slice(0, 5)
}

// ── Score match between a missing and found person ────────────────────────
function scoreMatch(missing, found) {
  let score = 0
  const dist = levenshtein(missing.name, found.name)
  const nameLen = Math.max((missing.name || '').length, (found.name || '').length, 1)
  score += Math.max(0, 50 - (dist / nameLen) * 50)
  if (missing.lastKnownLocation?.district &&
      found.lastKnownLocation?.district &&
      missing.lastKnownLocation.district === found.lastKnownLocation.district) score += 20
  if (missing.gender && found.gender && missing.gender === found.gender) score += 15
  const mAge = parseInt(missing.age), fAge = parseInt(found.age)
  if (!isNaN(mAge) && !isNaN(fAge)) score += Math.max(0, 15 - Math.abs(mAge - fAge) * 2)
  return Math.round(Math.min(score, 99))
}

// ── Run matching engine client-side after report submission ───────────────
async function runMatchingEngine(docId, reportData) {
  try {
    const foundSnap = await getDocs(collection(db, 'found_persons'))
    let bestScore = 0
    let bestMatchId = null
    foundSnap.forEach((d) => {
      const score = scoreMatch(reportData, d.data())
      if (score > bestScore) { bestScore = score; bestMatchId = d.id }
    })

    // ── Step 1: Create rescue task (do this FIRST so it always runs) ──────
    if (bestScore < 40) {
      try {
        await addDoc(collection(db, 'tasks'), {
          name: reportData.name || 'Unknown',
          priority: 'HIGH',
          location: reportData.lastKnownLocation?.description || reportData.lastKnownLocation?.district || 'Unknown',
          district: reportData.lastKnownLocation?.district || null,
          team: 'Unassigned',
          status: 'open',
          missingPersonId: docId,
          notes: 'Auto-created: no match found.',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      } catch (taskErr) {
        console.warn('[DisasterIQ] Task creation error:', taskErr)
      }
    }

    // ── Step 2: Update confidence score on the report ─────────────────────
    try {
      await updateDoc(doc(db, COL, docId), {
        confidence: bestScore,
        matchedWith: bestScore >= 40 ? bestMatchId : null,
        updatedAt: serverTimestamp(),
      })
    } catch (updateErr) {
      console.warn('[DisasterIQ] Confidence update error (non-critical):', updateErr)
    }

    // ── Step 3: Update global stats ───────────────────────────────────────
    try {
      await setDoc(doc(db, 'stats', 'global'), {
        missing: increment(1),
        updatedAt: serverTimestamp(),
      }, { merge: true })
    } catch (statsErr) {
      console.warn('[DisasterIQ] Stats update error (non-critical):', statsErr)
    }

  } catch (err) {
    console.warn('[DisasterIQ] Matching engine error (non-critical):', err)
  }
}

// ── Client-side rate limit: max 3 reports per session ────────────────────
const sessionReportCount = { count: 0, resetAt: Date.now() + 3600000 }

function checkRateLimit() {
  if (Date.now() > sessionReportCount.resetAt) {
    sessionReportCount.count = 0
    sessionReportCount.resetAt = Date.now() + 3600000
  }
  if (sessionReportCount.count >= 3) {
    throw new Error('Too many reports submitted. Please wait before submitting again.')
  }
  sessionReportCount.count++
}

// ── Submit a new missing person report ──────────────────────────────────
export async function submitMissingPersonReport(formData) {
  await ensureAnonymousAuth()
  checkRateLimit()

  const refId = generateRefId()
  const payload = {
    refId,
    name: formData.name?.trim() || 'Unknown',
    age: formData.age || null,
    gender: formData.gender || null,
    relationship: formData.relationship || null,
    lastKnownLocation: {
      description: formData.location?.trim() || null,
      district: formData.district || null,
      dateLastSeen: formData.date || null,
      timeLastSeen: formData.time || null,
    },
    description: formData.description?.trim() || null,
    photoUrl: null,
    reporterContact: {
      phone: formData.phone?.trim() || null,
      altPhone: formData.altPhone?.trim() || null,
    },
    reporterUid: auth.currentUser?.uid || null,   // ← needed for owner-based rule checks
    status: 'missing',
    confidence: null,
    matchedWith: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  const docRef = await addDoc(collection(db, COL), payload)

  // Run matching engine async — don't await, don't block the UI
  runMatchingEngine(docRef.id, payload)

  return { id: docRef.id, refId }
}

// ── Fetch a single report by Firestore doc ID ────────────────────────────
export async function getMissingPersonById(id) {
  const snap = await getDoc(doc(db, COL, id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ── Search missing persons ────────────────────────────────────────────────
export async function searchMissingPersons(searchTerm = '', filters = {}) {
  const snap = await getDocs(
    query(collection(db, COL), orderBy('createdAt', 'desc'), limit(100))
  )
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  const term = searchTerm.toLowerCase()
  return all
    .filter((p) => {
      const nameMatch = !term ||
        p.name?.toLowerCase().includes(term) ||
        p.lastKnownLocation?.description?.toLowerCase().includes(term)
      const districtMatch = !filters.district ||
        p.lastKnownLocation?.district?.toLowerCase().includes(filters.district.toLowerCase())
      const genderMatch = !filters.gender || p.gender === filters.gender
      return nameMatch && districtMatch && genderMatch
    })
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
}

// ── Real-time listener for a specific report ─────────────────────────────
export function subscribeMissingPerson(id, callback) {
  return onSnapshot(doc(db, COL, id), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() })
  })
}

// ── Update status ────────────────────────────────────────────────────────
export async function updateMissingPersonStatus(id, status) {
  await ensureAnonymousAuth()
  await updateDoc(doc(db, COL, id), {
    status,
    updatedAt: serverTimestamp(),
  })
  // Update global stats counter
  if (status === 'found') {
    await updateDoc(doc(db, 'stats', 'global'), {
      missing: increment(-1),
      found: increment(1),
      updatedAt: serverTimestamp(),
    })
  }
}
