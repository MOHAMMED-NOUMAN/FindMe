import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, UserX, LogOut, ShieldCheck, Loader2 } from 'lucide-react'
import CommandMap from '../components/rescue/CommandMap'
import TaskBoard from '../components/rescue/TaskBoard'
import KPIBar from '../components/rescue/KPIBar'
import AIMatchResults from '../components/AIMatchResults'
import { subscribeCriticalAlerts, subscribeUnassignedCount } from '../firebase/tasks'
import { signInWithGoogle, signOutUser, onAuthChange } from '../firebase/authService'

// ── Login Gate ────────────────────────────────────────────────────────────
function LoginGate({ onLogin, loading }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#E0F2FE]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 max-w-sm w-full mx-4 text-center"
      >
        <div className="w-14 h-14 bg-[#1E3A8A]/8 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="w-7 h-7 text-[#1E3A8A]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0F172A] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Rescue Access
        </h1>
        <p className="text-sm text-[#475569] mb-8 leading-relaxed">
          This dashboard is restricted to authorised rescue team members. Sign in with your Google account to continue.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#162D6B] text-white text-sm font-semibold transition-colors shadow-md shadow-[#1E3A8A]/20 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'Signing in…' : 'Sign in with Google'}
        </motion.button>
      </motion.div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function RescueDashboard() {
  const [user, setUser]               = useState(undefined)  // undefined = loading
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError]   = useState(null)
  const [criticalCount, setCriticalCount] = useState(0)
  const [unassignedCount, setUnassignedCount] = useState(0)

  // Track auth state
  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u))
    return () => unsub()
  }, [])

  // Live task alert counts (only when logged in as Google user)
  useEffect(() => {
    if (!user || user.isAnonymous) return
    const unsubCrit     = subscribeCriticalAlerts(setCriticalCount)
    const unsubUnassigned = subscribeUnassignedCount(setUnassignedCount)
    return () => { unsubCrit(); unsubUnassigned() }
  }, [user])

  const handleLogin = async () => {
    setLoginLoading(true)
    setLoginError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setLoginError('Sign-in failed. Please try again.')
      console.error(err)
    } finally {
      setLoginLoading(false)
    }
  }

  // Still resolving auth state
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#1E3A8A] animate-spin" />
      </div>
    )
  }

  // Not logged in or anonymous user → show login gate
  if (!user || user.isAnonymous) {
    return (
      <>
        <LoginGate onLogin={handleLogin} loading={loginLoading} />
        {loginError && (
          <p className="text-center text-sm text-red-500 mt-2">{loginError}</p>
        )}
      </>
    )
  }

  const slaAlerts = [
    criticalCount > 0
      ? { id: 1, text: `${criticalCount} critical task${criticalCount > 1 ? 's' : ''} pending`, severity: 'critical' }
      : null,
    unassignedCount > 0
      ? { id: 2, text: `${unassignedCount} unassigned case${unassignedCount > 1 ? 's' : ''}`, severity: 'warning' }
      : null,
  ].filter(Boolean)

  return (
    <div className="h-screen flex flex-col" style={{ fontFamily: 'var(--font-body)' }}>
      <div className="shrink-0 h-[96px]" />

      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT PANEL ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="w-[40%] shrink-0 border-r border-slate-200/60 bg-[#F8FAFC] flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

            {/* Signed-in user bar */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <img
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'R')}&background=1E3A8A&color=fff`}
                  alt={user.displayName}
                  className="w-7 h-7 rounded-full"
                />
                <span className="text-xs font-semibold text-slate-600">{user.displayName || user.email}</span>
              </div>
              <button
                onClick={signOutUser}
                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>

            <KPIBar />

            {slaAlerts.length > 0 && (
              <div className="flex gap-2">
                {slaAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-semibold ${
                      alert.severity === 'critical'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : 'bg-amber-50 border-amber-200 text-amber-700'
                    }`}
                  >
                    {alert.severity === 'critical'
                      ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      : <UserX className="w-3.5 h-3.5 shrink-0" />
                    }
                    {alert.text}
                  </motion.div>
                ))}
              </div>
            )}

            <AIMatchResults />

            <TaskBoard />
          </div>
        </motion.div>

        {/* ── RIGHT PANEL — MAP ───────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <CommandMap />
        </motion.div>

      </div>
    </div>
  )
}

