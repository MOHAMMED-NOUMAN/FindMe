import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Search, UserPlus, ShieldCheck } from 'lucide-react'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
}

export default function Hero() {
  return (
    <section id="home" className="relative flex min-h-screen items-center justify-center px-5 py-32">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-4xl text-center space-y-6"
      >
        {/* Label */}
        <motion.div variants={fadeUp} className="flex justify-center">
          <span
            className="inline-block rounded-full bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 px-4 py-1.5 text-xs text-[#1E3A8A] tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-accent)' }}
          >
            Disaster Response Platform
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          <span className="text-[#0F172A]">Find </span>
          <span className="bg-gradient-to-r from-[#1E3A8A] to-[#2DD4BF] bg-clip-text text-transparent">Me</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={fadeUp}
          className="text-xl sm:text-2xl font-medium text-[#475569] max-w-2xl mx-auto"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Reuniting families when it matters most. Fast. Reliable. Human.
        </motion.p>

        {/* Subtext */}
        <motion.p
          variants={fadeUp}
          className="text-base sm:text-lg text-[#475569]/80 max-w-xl mx-auto"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          A disaster response platform that helps locate missing individuals, report found persons, and coordinate rescue efforts in real time.
        </motion.p>

        {/* 3 CTA Buttons */}
        <motion.div variants={fadeUp} className="pt-4 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3">
          {/* Search for Someone */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 bg-[#1E3A8A] hover:bg-[#162D6B] text-white rounded-xl px-6 py-3.5 font-semibold text-sm transition-colors shadow-md shadow-[#1E3A8A]/20"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <Search className="w-4 h-4" />
              Search for Someone
            </Link>
          </motion.div>

          {/* Report Missing */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/report"
              className="inline-flex items-center justify-center gap-2 bg-[#FB7185] hover:bg-[#f43f5e] text-white rounded-xl px-6 py-3.5 font-semibold text-sm transition-colors shadow-md shadow-[#FB7185]/20"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <UserPlus className="w-4 h-4" />
              Report Missing Person
            </Link>
          </motion.div>

          {/* I Am Safe */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/safe"
              className="inline-flex items-center justify-center gap-2 border-2 border-[#2DD4BF] text-[#2DD4BF] hover:bg-[#2DD4BF]/10 rounded-xl px-6 py-3.5 font-semibold text-sm transition-colors"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <ShieldCheck className="w-4 h-4" />
              I Am Safe
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
