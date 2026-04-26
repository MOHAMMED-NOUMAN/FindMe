// ============================================================
// DisasterIQ — Auth Service
// Anonymous auth  → civilian report submissions (free, no SMS)
// Google Sign-In  → rescue team / coordinator dashboard access
// ============================================================

import {
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { auth } from './config'

const googleProvider = new GoogleAuthProvider()

// ── Sign in with Google (rescue team / coordinator) ───────────────────────
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

// ── Sign in anonymously (auto-called before civilian report writes) ────────
export async function ensureAnonymousAuth() {
  if (auth.currentUser) return auth.currentUser
  const credential = await signInAnonymously(auth)
  return credential.user
}

// ── Check if current user signed in via Google (not anonymous) ────────────
export function isGoogleUser() {
  const user = auth.currentUser
  return !!(user && !user.isAnonymous)
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
