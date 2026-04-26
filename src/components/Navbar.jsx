import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const navLinks = [
  { key: 'home', to: '/' },
  { key: 'search', to: '/search' },
  { key: 'report', to: '/report' },
  { key: 'safe', to: '/safe' },
  { key: 'rescue', to: '/rescue' },
]

const messages = [
  '🌧️ Heavy rainfall expected in northern districts',
  '⛺ Relief camps open at Kozhikode, Wayanad, Malappuram',
  '🚁 Rescue teams deployed to flooded zones',
  '📞 Emergency helpline: 1800-xxx-xxxx',
  '🛡️ Stay indoors unless evacuated by authorities',
  '💊 Medical aid available at Calicut General Hospital',
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const location = useLocation()
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    setLangOpen(false)
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 flex flex-col"
    >
      {/* ── Live Alerts Banner ─────────────────────────── */}
      <div className="flex items-center overflow-hidden border-b border-red-200" style={{ fontFamily: 'var(--font-body)' }}>
        <div className="bg-red-500 text-white text-xs font-bold px-4 py-1.5 shrink-0 tracking-wide uppercase z-10 relative shadow-sm">LIVE</div>
        <div className="flex-1 bg-red-50 overflow-hidden relative h-7 sm:h-8 flex items-center">
          <motion.div
            className="flex items-center gap-12 whitespace-nowrap text-xs sm:text-sm text-red-900 font-medium absolute"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            {[...messages, ...messages].map((msg, i) => (
              <span key={i} className="flex items-center gap-2">
                {msg}
                <span className="text-red-300">•</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ── Main Nav ────────────────────────────────── */}
      <nav className={`
        backdrop-blur-md border-b border-gray-200 transition-all duration-300
        ${scrolled ? 'bg-white/80 shadow-sm' : 'bg-white/60'}
      `}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 text-2xl font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <span className="text-[#0F172A]">Find</span>
              <span className="bg-gradient-to-r from-[#1E3A8A] to-[#2DD4BF] bg-clip-text text-transparent">Me</span>
            </Link>

            {/* Desktop Links */}
            <ul className="hidden md:flex items-center gap-1" style={{ fontFamily: 'var(--font-body)' }}>
              {navLinks.map(({ key, to }) => {
                const isActive = location.pathname === to
                return (
                  <li key={key}>
                    <Link
                      to={to}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                        ${isActive
                          ? 'text-[#1E3A8A] bg-[#1E3A8A]/8 font-semibold'
                          : 'text-[#475569] hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5'
                        }`}
                    >
                      {t(`navbar.${key}`)}
                    </Link>
                  </li>
                )
              })}
            </ul>

            {/* Right: Language + Hamburger */}
            <div className="flex items-center gap-2">
              <Link
                to="/report-found"
                className="hidden md:flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-[#1E3A8A] text-white hover:bg-[#162D6B] transition-colors shadow-sm"
              >
                Report Found Person
              </Link>
              <div className="relative">
                <button
                  aria-label="Select language"
                  title="Language selector"
                  onClick={() => setLangOpen(!langOpen)}
                  className="h-9 w-9 flex items-center justify-center rounded-lg text-[#475569] hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition-colors"
                >
                  <Globe className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 overflow-hidden"
                    >
                      {[
                        { code: 'en', label: 'English' },
                        { code: 'hi', label: 'हिंदी' },
                        { code: 'te', label: 'తెలుగు' }
                      ].map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                            i18n.language === lang.code 
                              ? 'text-[#1E3A8A] bg-[#1E3A8A]/5 font-semibold' 
                              : 'text-[#475569] hover:bg-slate-50 hover:text-[#1E3A8A]'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                aria-label="Toggle menu"
                onClick={() => setMobileOpen((v) => !v)}
                className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg text-[#475569] hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5">
                  {mobileOpen ? (
                    <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
                  ) : (
                    <><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></>
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden md:hidden bg-white/97 backdrop-blur-md border-t border-gray-200"
            >
              <ul className="flex flex-col gap-1 px-5 py-3" style={{ fontFamily: 'var(--font-body)' }}>
                {navLinks.map(({ key, to }) => (
                  <li key={key}>
                    <Link
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 text-base font-medium text-[#475569] rounded-xl transition-colors hover:text-[#1E3A8A] hover:bg-[#1E3A8A]/5"
                    >
                      {t(`navbar.${key}`)}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/report-found"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-base font-semibold bg-[#1E3A8A] text-white rounded-xl transition-colors hover:bg-[#162D6B] mt-2 text-center"
                  >
                    Report Found Person
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </motion.header>
  )
}
