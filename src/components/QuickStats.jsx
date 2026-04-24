import { motion } from 'framer-motion'
import { Users, UserCheck, Tent, Headphones } from 'lucide-react'

const stats = [
  { id: 'missing', label: 'Missing', value: '1,247', icon: Users, color: 'text-[#FB7185]', bg: 'bg-[#FB7185]/8' },
  { id: 'found', label: 'Found', value: '389', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { id: 'camps', label: 'Camps Open', value: '42', icon: Tent, color: 'text-[#2DD4BF]', bg: 'bg-[#2DD4BF]/8' },
  { id: 'teams', label: 'Teams Active', value: '18', icon: Headphones, color: 'text-[#1E3A8A]', bg: 'bg-[#1E3A8A]/8' },
]

export default function QuickStats() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="px-5 max-w-6xl mx-auto -mt-6 relative z-20"
    >
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 overflow-hidden">
        {stats.map(({ id, label, value, icon: Icon, color, bg }) => (
          <div key={id} className="flex items-center gap-4 px-6 py-5">
            <div className={`p-2.5 rounded-xl ${bg} shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div style={{ fontFamily: 'var(--font-body)' }}>
              <p className="text-2xl font-bold text-[#0F172A] leading-none">{value}</p>
              <p className="text-xs text-[#475569] mt-1 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
