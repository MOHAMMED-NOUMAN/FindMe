import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, MapPin, Phone, ChevronDown, ChevronUp,
  Send, Loader2, CheckCircle2, RefreshCw, Bell
} from 'lucide-react'

// ── Pulse ring around the main CTA ────────────────────────────────────────
function PulseRing({ active }) {
  if (!active) return null
  return (
    <>
      <span className="absolute inset-0 rounded-2xl bg-emerald-400 opacity-30 animate-ping" />
      <span className="absolute inset-0 rounded-2xl bg-emerald-400 opacity-20 animate-ping [animation-delay:0.4s]" />
    </>
  )
}

export default function SafePage() {
  const [phase, setPhase]             = useState('form')   // 'form' | 'otp' | 'done'
  const [phone, setPhone]             = useState('')
  const [otp, setOtp]                 = useState(['', '', '', '', '', ''])
  const [noteOpen, setNoteOpen]       = useState(false)
  const [note, setNote]               = useState('')
  const [location, setLocation]       = useState('Wayanad, Kerala, India')
  const [locLoading, setLocLoading]   = useState(false)
  const [sending, setSending]         = useState(false)
  const otpRefs                       = useRef([])

  // ── Geolocation ────────────────────────────────────────────────────────
  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setLocation(`${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`)
        setLocLoading(false)
      },
      () => {
        alert('Unable to retrieve your location. Please enable location permissions.')
        setLocLoading(false)
      },
      { timeout: 10000 }
    )
  }

  // ── OTP digit handler ──────────────────────────────────────────────────
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const updated = [...otp]
    updated[idx] = val
    setOtp(updated)
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus()
  }

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus()
    }
  }

  // ── Send safe status ───────────────────────────────────────────────────
  const handleSendOtp = () => {
    if (!phone.trim()) return
    setSending(true)
    setTimeout(() => { setSending(false); setPhase('otp') }, 1200)
  }

  const handleVerifyOtp = () => {
    if (otp.join('').length < 6) return
    setSending(true)
    setTimeout(() => { setSending(false); setPhase('done') }, 1200)
  }

  // ── Success screen ─────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-20"
           style={{ fontFamily: 'var(--font-body)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="max-w-sm w-full text-center"
        >
          {/* Big green check */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
            className="relative w-28 h-28 mx-auto mb-8"
          >
            <span className="absolute inset-0 rounded-full bg-emerald-400/25 animate-ping" />
            <div className="relative w-full h-full bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <ShieldCheck className="w-14 h-14 text-white" strokeWidth={1.8} />
            </div>
          </motion.div>

          <h1 className="text-4xl font-bold text-emerald-700 mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}>
            You're Safe!
          </h1>
          <p className="text-[#475569] text-lg mb-1">You've been marked safe.</p>
          <p className="text-[#475569] text-sm mb-8">Notifications sent to your contacts and local rescue teams.</p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-left space-y-3 mb-8">
            <div className="flex items-center gap-3 text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>Status broadcast to rescue coordination</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-800">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span>Location logged: {location}</span>
            </div>
            {note.trim() && (
              <div className="flex items-center gap-3 text-sm text-emerald-800">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <span>Message sent to contacts</span>
              </div>
            )}
          </div>

          <button
            onClick={() => { setPhase('form'); setOtp(['','','','','','']); setPhone('') }}
            className="text-sm text-slate-400 hover:text-slate-600 underline underline-offset-4 transition-colors"
          >
            Mark another person as safe
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-5 pt-28 pb-20 max-w-lg mx-auto"
         style={{ fontFamily: 'var(--font-body)' }}>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="text-center space-y-1 pb-2">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center border border-emerald-200">
              <ShieldCheck className="w-7 h-7 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-[#0F172A]"
              style={{ fontFamily: 'var(--font-heading)' }}>
            I'm Safe
          </h1>
          <p className="text-[#475569] text-sm">
            Let your family and rescue teams know you're safe.
          </p>
        </div>

        {/* ── Main CTA ───────────────────────────────────────────────── */}
        <div className="relative flex justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="relative w-full py-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-2xl font-bold tracking-wide shadow-xl shadow-emerald-500/30 transition-colors overflow-hidden"
            onClick={() => phase === 'form' && document.getElementById('phone-input')?.focus()}
          >
            <PulseRing active />
            <span className="relative z-10 flex items-center justify-center gap-3">
              <ShieldCheck className="w-7 h-7" strokeWidth={2} />
              I AM SAFE
            </span>
          </motion.button>
        </div>

        {/* ── Location ───────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Location</p>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-sm font-medium text-[#0F172A] truncate flex-1">{location}</span>
          </div>
          <p className="text-xs text-slate-400">Your current location will be shared with rescue teams</p>
          <button
            onClick={handleUpdateLocation}
            disabled={locLoading}
            className="flex items-center gap-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50 transition-colors"
          >
            {locLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <RefreshCw className="w-3.5 h-3.5" />
            }
            {locLoading ? 'Detecting…' : 'Update Location'}
          </button>
        </div>

        {/* ── Phone + OTP ────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notify Contacts</p>

          <AnimatePresence mode="wait">
            {phase === 'form' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-3"
              >
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="phone-input"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSendOtp}
                  disabled={!phone.trim() || sending}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-colors shadow-md shadow-emerald-500/20"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  {sending ? 'Sending OTP…' : 'Notify My Contacts'}
                </motion.button>
              </motion.div>
            )}

            {phase === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <p className="text-sm text-[#475569]">
                  Enter the 6-digit OTP sent to <span className="font-bold text-[#0F172A]">{phone}</span>
                </p>
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="tel"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-11 h-14 text-center text-xl font-bold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition"
                    />
                  ))}
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleVerifyOtp}
                  disabled={otp.join('').length < 6 || sending}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm transition-colors shadow-md shadow-emerald-500/20"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Verifying…' : 'Confirm I\'m Safe'}
                </motion.button>
                <button
                  onClick={() => setPhase('form')}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ← Change number
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Optional Note ──────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <button
            onClick={() => setNoteOpen((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors"
          >
            <span>Add a message (optional)</span>
            {noteOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          <AnimatePresence initial={false}>
            {noteOpen && (
              <motion.div
                key="note"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-5">
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. I'm at the relief camp near Chooralmala. I have water and food."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none transition"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  )
}
