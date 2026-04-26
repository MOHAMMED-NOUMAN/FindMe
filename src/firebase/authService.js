// ============================================================
// DisasterIQ — Auth Service
// Uses Anonymous auth — free, no SMS cost.
// Phone number is collected as plain text in the report form
// and stored in Firestore. OTP verification is Phase 2.
// ============================================================

import { signInAnonymously, signOut, onAuthStateChanged } from 'firebase/auth'
import { auth } from './config'

// ── Sign in anonymously (called automatically before any Firestore write) ─
// Returns the user object. Safe to call multiple times — if already signed
// in, Firebase returns the existing session immediately.
export async function ensureAnonymousAuth() {
  if (auth.currentUser) return auth.currentUser
  const credential = await signInAnonymously(auth)
  return credential.user
}

// ── Sign out ──────────────────────────────────────────────────────────────
export async function signOutUser() {
  await signOut(auth)
}

// ── Get current user (null if not signed in) ──────────────────────────────
export function getCurrentUser() {
  return auth.currentUser
}

// ── Listen to auth state changes ──────────────────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}
