// ============================================================
// DisasterIQ — Cloud Functions (2nd Gen)
// Region: asia-south1 (Mumbai — closest to Kerala disaster zone)
//
// Functions:
//  1. onMissingPersonCreated   — matching engine + stats update
//  2. onMissingPersonUpdated   — re-runs matching, sends notifications
//  3. autoAssignTask           — assigns nearest available rescue team
//  4. getQuickStats            — HTTPS endpoint for live stats
//  5. submitReport             — HTTPS callable wrapper (rate-limited)
//  6. deduplicateReport        — detects duplicate reports on creation
// ============================================================

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const { setGlobalOptions } = require('firebase-functions/v2')
const admin = require('firebase-admin')

admin.initializeApp()
const db = admin.firestore()

// All functions run in Mumbai region for latency
setGlobalOptions({ region: 'asia-south1', maxInstances: 10 })

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Levenshtein distance for fuzzy name matching */
function levenshtein(a, b) {
  if (!a || !b) return 99
  a = a.toLowerCase(); b = b.toLowerCase()
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

/** Simple confidence scorer: name + district + gender + age */
function scoreMatch(missing, found) {
  let score = 0

  // Name similarity (up to 50 pts)
  const dist = levenshtein(missing.name, found.name)
  const nameLen = Math.max((missing.name || '').length, (found.name || '').length, 1)
  score += Math.max(0, 50 - (dist / nameLen) * 50)

  // District match (20 pts)
  if (
    missing.lastKnownLocation?.district &&
    found.lastKnownLocation?.district &&
    missing.lastKnownLocation.district === found.lastKnownLocation.district
  ) score += 20

  // Gender match (15 pts)
  if (missing.gender && found.gender && missing.gender === found.gender) score += 15

  // Age proximity (15 pts)
  const mAge = parseInt(missing.age), fAge = parseInt(found.age)
  if (!isNaN(mAge) && !isNaN(fAge)) {
    const ageDiff = Math.abs(mAge - fAge)
    score += Math.max(0, 15 - ageDiff * 2)
  }

  return Math.round(Math.min(score, 99))
}

/** Update the global stats aggregate document */
async function updateGlobalStats() {
  const [missingSnap, foundSnap, tasksSnap] = await Promise.all([
    db.collection('missing_persons').where('status', '==', 'missing').count().get(),
    db.collection('missing_persons').where('status', '==', 'found').count().get(),
    db.collection('tasks').where('status', 'in', ['enroute', 'onscene']).count().get(),
  ])

  await db.doc('stats/global').set({
    missing: missingSnap.data().count,
    found: foundSnap.data().count,
    activeRescues: tasksSnap.data().count,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. onMissingPersonCreated — run matching engine + update stats
// ─────────────────────────────────────────────────────────────────────────────
exports.onMissingPersonCreated = onDocumentCreated(
  'missing_persons/{docId}',
  async (event) => {
    const missing = event.data.data()
    const docId = event.params.docId

    // Run matching against found_persons collection
    const foundSnap = await db.collection('found_persons').get()
    let bestMatch = null
    let bestScore = 0

    foundSnap.forEach((fDoc) => {
      const found = fDoc.data()
      const score = scoreMatch(missing, found)
      if (score > bestScore) {
        bestScore = score
        bestMatch = { id: fDoc.id, score }
      }
    })

    const updates = {
      confidence: bestScore,
      matchedWith: bestMatch && bestScore >= 40 ? bestMatch.id : null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
    await event.data.ref.update(updates)

    // Also create a rescue task if high priority (no match found and score < 40)
    if (bestScore < 40) {
      await db.collection('tasks').add({
        name: missing.name || 'Unknown',
        priority: 'HIGH',
        location: missing.lastKnownLocation?.description || missing.lastKnownLocation?.district || 'Unknown',
        district: missing.lastKnownLocation?.district || null,
        team: 'Unassigned',
        status: 'open',
        missingPersonId: docId,
        notes: 'Auto-created: no match found in found_persons.',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
    }

    await updateGlobalStats()
    console.log(`[onMissingPersonCreated] ${docId} — confidence: ${bestScore}`)
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// 2. onMissingPersonUpdated — re-run matching, send notifications if found
// ─────────────────────────────────────────────────────────────────────────────
exports.onMissingPersonUpdated = onDocumentUpdated(
  'missing_persons/{docId}',
  async (event) => {
    const before = event.data.before.data()
    const after = event.data.after.data()

    // Only act if status changed to 'found'
    if (before.status !== 'found' && after.status === 'found') {
      // Fetch all notification subscribers for this person
      const subsSnap = await db
        .collection('notification_subscriptions')
        .where('missingPersonId', '==', event.params.docId)
        .get()

      const notifications = []
      subsSnap.forEach((sub) => {
        const { phone, channel } = sub.data()
        // In production: call Twilio API or FCM here
        // For now, log the notification
        console.log(`[NOTIFY] ${channel} → ${phone}: "${after.name || 'Person'}" has been found!`)
        notifications.push({ phone, channel, personName: after.name })
      })

      console.log(`[onMissingPersonUpdated] ${event.params.docId} found. Notified ${notifications.length} subscribers.`)
      await updateGlobalStats()
    }
  }
)

// ─────────────────────────────────────────────────────────────────────────────
// 3. autoAssignTask — HTTPS Callable: assign nearest available team
// ─────────────────────────────────────────────────────────────────────────────
exports.autoAssignTask = onCall(async (request) => {
  const { taskId } = request.data
  if (!taskId) throw new HttpsError('invalid-argument', 'taskId is required')

  const taskRef = db.collection('tasks').doc(taskId)
  const taskSnap = await taskRef.get()
  if (!taskSnap.exists) throw new HttpsError('not-found', 'Task not found')

  // Find an available team (status=active, not currently assigned)
  const teamsSnap = await db
    .collection('teams')
    .where('status', '==', 'active')
    .where('currentTaskId', '==', null)
    .limit(1)
    .get()

  if (teamsSnap.empty) {
    return { assigned: false, reason: 'No available teams' }
  }

  const teamDoc = teamsSnap.docs[0]
  const teamName = teamDoc.data().name || teamDoc.id

  await taskRef.update({
    team: teamName,
    status: 'assigned',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  await teamDoc.ref.update({ currentTaskId: taskId })

  return { assigned: true, team: teamName }
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. getQuickStats — HTTPS REST endpoint (no auth required, for public banner)
// ─────────────────────────────────────────────────────────────────────────────
exports.getQuickStats = onRequest({ cors: true }, async (req, res) => {
  const statsSnap = await db.doc('stats/global').get()
  if (!statsSnap.exists) {
    res.status(404).json({ error: 'Stats not yet computed' })
    return
  }
  res.json({ ok: true, stats: statsSnap.data() })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. submitReport — HTTPS Callable wrapper with rate limiting
// ─────────────────────────────────────────────────────────────────────────────
exports.submitReport = onCall(async (request) => {
  const { formData } = request.data

  if (!formData || !formData.name || !formData.phone) {
    throw new HttpsError('invalid-argument', 'name and phone are required')
  }

  // Rate limit: max 3 reports per phone per hour
  const oneHourAgo = admin.firestore.Timestamp.fromMillis(Date.now() - 3600000)
  const recentSnap = await db
    .collection('missing_persons')
    .where('reporterContact.phone', '==', formData.phone)
    .where('createdAt', '>=', oneHourAgo)
    .count()
    .get()

  if (recentSnap.data().count >= 3) {
    throw new HttpsError('resource-exhausted', 'Too many reports from this number. Please wait before submitting again.')
  }

  const refId = 'FM-' + Math.random().toString(36).slice(2, 8).toUpperCase()
  const docRef = await db.collection('missing_persons').add({
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
      phone: formData.phone?.trim(),
      altPhone: formData.altPhone?.trim() || null,
    },
    status: 'missing',
    confidence: null,
    matchedWith: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { id: docRef.id, refId }
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. deduplicateReport — detects duplicate names on each new report
// ─────────────────────────────────────────────────────────────────────────────
exports.deduplicateReport = onCall(async (request) => {
  const { name, district } = request.data
  if (!name) throw new HttpsError('invalid-argument', 'name is required')

  const snap = await db.collection('missing_persons')
    .where('status', '==', 'missing')
    .get()

  const matches = []
  snap.forEach((d) => {
    const data = d.data()
    const dist = levenshtein(name, data.name || '')
    if (dist <= 3) {   // within 3 edit-distance = possible duplicate
      matches.push({
        id: d.id,
        name: data.name,
        district: data.lastKnownLocation?.district,
        age: data.age,
      })
    }
  })

  return { matches: matches.slice(0, 5) }
})
