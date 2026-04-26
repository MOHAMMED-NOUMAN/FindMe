import { ChevronDown } from 'lucide-react'
import indiaData from '../../data/indiaStatesDistricts.json'

export default function MapControls({ selectedState, setSelectedState, selectedDistrict, setSelectedDistrict }) {
  const states = indiaData.states.map(s => s.name).concat(indiaData.union_territories.map(u => u.name)).sort()
  
  let districts = []
  if (selectedState !== 'All') {
    const sObj = indiaData.states.find(s => s.name === selectedState) || indiaData.union_territories.find(u => u.name === selectedState)
    if (sObj) districts = sObj.districts
  }

  return (
    <div className="flex flex-wrap items-center gap-3 w-full" style={{ fontFamily: 'var(--font-body)' }}>
      {/* State Filter */}
      <div className="relative flex-1 min-w-[140px] max-w-[220px]">
        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value)
            setSelectedDistrict('All') // reset district
          }}
          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 cursor-pointer hover:border-slate-300 transition-colors"
        >
          <option value="All">All States (India)</option>
          {states.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>

      {/* District Filter */}
      <div className="relative flex-1 min-w-[140px] max-w-[220px]">
        <select
          value={selectedDistrict}
          onChange={(e) => setSelectedDistrict(e.target.value)}
          disabled={selectedState === 'All'}
          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 cursor-pointer hover:border-slate-300 transition-colors disabled:opacity-50"
        >
          <option value="All">All Districts</option>
          {districts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  )
}
