import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const filters = [
  { id: 'disaster', label: 'Disaster', options: ['All', 'Kerala Floods 2024', 'Cyclone Michaung', 'Wayanad Landslide'] },
  { id: 'district', label: 'District', options: ['All', 'Kozhikode', 'Wayanad', 'Malappuram', 'Thrissur'] },
  { id: 'status', label: 'Status', options: ['All', 'Missing', 'Found', 'In Progress', 'Closed'] },
  { id: 'time', label: 'Time Range', options: ['All', 'Last 1h', 'Last 6h', 'Last 24h', 'Last 7d'] },
]

export default function MapControls() {
  const [selected, setSelected] = useState({ disaster: 'All', district: 'All', status: 'All', time: 'All' })

  return (
    <div className="flex flex-wrap items-center gap-2" style={{ fontFamily: 'var(--font-body)' }}>
      {filters.map((f) => (
        <div key={f.id} className="relative">
          <select
            value={selected[f.id]}
            onChange={(e) => setSelected((s) => ({ ...s, [f.id]: e.target.value }))}
            className="appearance-none bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-lg text-[11px] font-semibold text-slate-600 pl-2.5 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]/30 cursor-pointer hover:border-slate-300 transition-colors"
          >
            {f.options.map((o) => (
              <option key={o} value={o}>{f.label}: {o}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
      ))}
    </div>
  )
}
