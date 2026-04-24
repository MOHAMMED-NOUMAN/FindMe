import { motion } from 'framer-motion'
import { UserSearch, UserCheck, ShieldCheck } from 'lucide-react'

const actions = [
  {
    id: 'report-missing',
    title: 'Report Missing Person',
    description: 'Submit details to help us locate someone.',
    icon: UserSearch,
    color: 'text-[#1E3A8A]',
    bg: 'bg-[#1E3A8A]/10',
    href: '#report-missing'
  },
  {
    id: 'report-found',
    title: 'Report Found Person',
    description: 'Register someone you have located safely.',
    icon: UserCheck,
    color: 'text-[#2DD4BF]',
    bg: 'bg-[#2DD4BF]/10',
    href: '#report-found'
  },
  {
    id: 'self-report',
    title: "Self Report (I'm Safe)",
    description: 'Let your loved ones know you are secure.',
    icon: ShieldCheck,
    color: 'text-[#FB7185]',
    bg: 'bg-[#FB7185]/10',
    href: '#self-report'
  }
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

export default function QuickActions() {
  return (
    <section className="px-5 pb-16 max-w-6xl mx-auto -mt-8 relative z-20">
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {actions.map((action) => (
          <motion.a
            key={action.id}
            href={action.href}
            variants={item}
            whileHover={{ scale: 1.03, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100 transition-colors hover:border-[#2DD4BF]/30 cursor-pointer"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <div className={`p-4 rounded-full ${action.bg} ${action.color} mb-5`}>
              <action.icon className="w-8 h-8" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-bold text-[#0F172A] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
              {action.title}
            </h3>
            <p className="text-[#475569] text-sm leading-relaxed">
              {action.description}
            </p>
          </motion.a>
        ))}
      </motion.div>
    </section>
  )
}
