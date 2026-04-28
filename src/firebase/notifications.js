// ============================================================
// DisasterIQ — Notifications Service
// FCM subscriptions + alert subscriptions stored in Firestore
// Collection: notification_subscriptions
// ============================================================

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

const COL = 'notification_subscriptions'

// ── Subscribe a phone number to alerts for a specific missing person ──────
// This is what the "Notify Me" button in SearchPage does.
export async function subscribeToPersonAlerts(missingPersonId, phone) {
  // Prevent duplicate subscriptions
  const existing = await getDocs(
    query(
      collection(db, COL),
      where('missingPersonId', '==', missingPersonId),
      where('phone', '==', phone)
    )
  )
  if (!existing.empty) return { already: true }

  const ref = await addDoc(collection(db, COL), {
    missingPersonId,
    phone,
    channel: 'sms',  // 'sms' | 'fcm'
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, already: false }
}

// ── Unsubscribe ───────────────────────────────────────────────────────────
export async function unsubscribeFromPersonAlerts(missingPersonId, phone) {
  const snap = await getDocs(
    query(
      collection(db, COL),
      where('missingPersonId', '==', missingPersonId),
      where('phone', '==', phone)
    )
  )
  const deletes = snap.docs.map((d) => deleteDoc(doc(db, COL, d.id)))
  await Promise.all(deletes)
}

