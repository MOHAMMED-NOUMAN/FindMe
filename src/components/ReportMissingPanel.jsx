import { motion } from 'framer-motion'
import { Map, MapPin, Upload, Info, ChevronRight } from 'lucide-react'

export default function ReportMissingPanel() {
  return (
    <section id="report-missing" className="px-5 pb-24 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold text-[#0F172A] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          Report Missing Person
        </h2>
        <p className="text-lg text-[#475569]" style={{ fontFamily: 'var(--font-body)' }}>
          We predict where they might be using movement intelligence
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6" 
          style={{ fontFamily: 'var(--font-body)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-[#0F172A] mb-2">Name</label>
              <input type="text" placeholder="Full name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 transition-shadow" />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#0F172A] mb-2">Age</label>
              <input type="text" placeholder="e.g. 34 or Approx. 30s" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 transition-shadow" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-2">Last Seen Location</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Street, landmark, or coordinates" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 transition-shadow" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-2">Description</label>
            <textarea placeholder="Clothing, distinguishing features, etc." rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 transition-shadow resize-none"></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#0F172A] mb-2">Upload Photo</label>
            <div className="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 hover:border-slate-400 transition-colors cursor-pointer bg-slate-50/50">
              <Upload className="w-6 h-6 mb-2 text-slate-400" />
              <span className="text-sm font-medium">Click to upload photo</span>
              <span className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-2 bg-[#FB7185] hover:bg-[#f43f5e] text-white rounded-xl py-4 font-bold text-base transition-colors shadow-lg shadow-[#FB7185]/20 flex justify-center items-center gap-2"
          >
            Start Intelligent Search
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Right: Map & Insights */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-2 flex flex-col gap-6" 
          style={{ fontFamily: 'var(--font-body)' }}
        >
          {/* Step Indicator */}
          <div className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap overflow-x-auto pb-1 hide-scrollbar">
            <span className="text-[#1E3A8A] bg-[#1E3A8A]/10 px-3 py-1.5 rounded-lg border border-[#1E3A8A]/10">Enter Details</span>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            <span className="text-slate-400">Predict</span>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            <span className="text-slate-400">Match</span>
          </div>

          {/* Map Placeholder */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#0F172A]">Predicted Movement Zones</h3>
            </div>
            
            <div className="relative flex-1 bg-[#F8FAFC] rounded-xl overflow-hidden min-h-[200px] border border-slate-200 flex items-center justify-center isolate">
              <Map className="absolute w-24 h-24 text-slate-300 opacity-40 z-0" strokeWidth={1} />
              
              {/* Fake Heatmap Zones */}
              <div className="absolute top-[40%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-400/20 rounded-full blur-xl z-10"></div>
              <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-400/30 rounded-full blur-lg z-10"></div>
              <div className="absolute top-[50%] left-[55%] -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-400/40 rounded-full blur-md z-10"></div>
              
              {/* Overlay labels */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between gap-1.5 z-20">
                <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs font-bold text-red-600 shadow-sm border border-red-100 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> High
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs font-bold text-yellow-600 shadow-sm border border-yellow-100 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div> Med
                </div>
                <div className="bg-white/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-600 shadow-sm border border-blue-100 flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div> Low
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 text-center font-medium">
              Based on disaster type and past movement patterns
            </p>
          </div>

          {/* Insight Box */}
          <div className="bg-[#2DD4BF]/10 border border-[#2DD4BF]/20 rounded-2xl p-5 flex gap-4 items-start shadow-sm">
            <div className="p-2 bg-white rounded-full shrink-0 shadow-sm border border-[#2DD4BF]/20">
              <Info className="w-5 h-5 text-[#2DD4BF]" />
            </div>
            <div>
              <p className="text-sm text-[#0F172A] font-medium leading-relaxed">
                People often move towards roads, shelters, or higher ground during disasters
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
