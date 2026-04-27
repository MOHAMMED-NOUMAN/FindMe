import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, MapPin, Camera, Phone, Check, ChevronRight, ChevronLeft, AlertCircle, Loader2, X } from 'lucide-react'
import { submitMissingPersonReport, generateRefId, checkDuplicates } from '../firebase/missingPersons'
import indiaData from '../data/indiaStatesDistricts.json'

const STEPS = [
  { title: 'Person Details', icon: User },
  { title: 'Last Seen', icon: MapPin },
  { title: 'Photos & Description', icon: Camera },
  { title: 'Your Contact', icon: Phone },
]

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, i) => {
        const Icon = step.icon
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className={`flex flex-col items-center gap-1 ${active ? 'opacity-100' : done ? 'opacity-70' : 'opacity-40'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${done ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white'
                  : active ? 'bg-white border-[#1E3A8A] text-[#1E3A8A]'
                  : 'bg-white border-slate-200 text-slate-400'}`}
              >
                {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-semibold hidden sm:block whitespace-nowrap ${active ? 'text-[#1E3A8A]' : 'text-slate-400'}`}>
                {step.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-12 sm:w-16 h-0.5 mx-1 mb-5 transition-all duration-300 ${done ? 'bg-[#1E3A8A]' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Step1({ data, onChange }) {
  const [checking, setChecking] = useState(false)
  const [possibleMatches, setPossibleMatches] = useState([])

  const handleNameChange = async (val) => {
    onChange('name', val)
    if (val.length < 3) { setPossibleMatches([]); return }
    setChecking(true)
    try {
      const matches = await checkDuplicates(val)
      setPossibleMatches(matches)
    } catch {
      // non-critical
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-2">Full Name</label>
          <div className="relative">
            <input
              type="text" placeholder="e.g. Rajan Kumar"
              value={data.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
            />
            {checking && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />}
          </div>
          <AnimatePresence>
            {possibleMatches.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 mb-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Possible matches found — check before submitting
                </div>
                {possibleMatches.map((m, i) => (
                  <p key={i} className="text-xs text-amber-800 py-0.5">
                    • {m.name}{m.age ? `, ${m.age}` : ''}{m.district ? `, ${m.district}` : ''}
                  </p>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-2">Age (approximate)</label>
          <input
            type="text" placeholder="e.g. 34 or 30–40"
            value={data.age}
            onChange={(e) => onChange('age', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-2">Gender</label>
          <select
            value={data.gender}
            onChange={(e) => onChange('gender', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          >
            <option value="">Select</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-2">Your Relationship</label>
          <select
            value={data.relationship}
            onChange={(e) => onChange('relationship', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          >
            <option value="">Select</option>
            <option>Parent</option>
            <option>Spouse</option>
            <option>Child</option>
            <option>Sibling</option>
            <option>Other Relative</option>
            <option>Friend / Neighbour</option>
          </select>
        </div>
      </div>
    </div>
  )
}

function Step2({ data, onChange }) {
  const selectedStateObj = indiaData.states.find(s => s.name === data.state)
  const districts = selectedStateObj ? selectedStateObj.districts : []

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-[#0F172A] mb-2">Last Seen Location</label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" placeholder="Street, landmark, or area"
            value={data.location}
            onChange={(e) => onChange('location', e.target.value)}
            className="w-full pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-2">Date Last Seen</label>
          <input
            type="date"
            value={data.date}
            onChange={(e) => onChange('date', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-2">Approx. Time</label>
          <input
            type="time"
            value={data.time}
            onChange={(e) => onChange('time', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-2">State</label>
          <select
            value={data.state || ''}
            onChange={(e) => {
              onChange('state', e.target.value)
              onChange('district', '')
              onChange('customDistrict', '')
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          >
            <option value="">Select State</option>
            {indiaData.states.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-[#0F172A] mb-2">District / City</label>
          {data.district === 'Other' ? (
            <div className="relative">
              <input
                type="text"
                placeholder="Type district name"
                value={data.customDistrict || ''}
                onChange={(e) => onChange('customDistrict', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
              <button 
                type="button"
                onClick={() => { onChange('district', ''); onChange('customDistrict', ''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <select
              value={data.district || ''}
              onChange={(e) => {
                onChange('district', e.target.value)
                if (e.target.value !== 'Other') onChange('customDistrict', '')
              }}
              disabled={!data.state}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 disabled:opacity-50"
            >
              <option value="">Select District</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
              {data.state && <option value="Other">Other (Type below)</option>}
            </select>
          )}
        </div>
      </div>
    </div>
  )
}

function Step3({ data, onChange }) {
  const [preview, setPreview] = useState(null)
  const fileInputRef = useRef(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    onChange('photoFile', file)
    setPreview(URL.createObjectURL(file))
  }

  const handleBoxClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-[#0F172A] mb-2">Upload Photo</label>
        {preview ? (
          <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={() => { setPreview(null); onChange('photoFile', null) }}
              className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ) : (
          <div onClick={handleBoxClick} className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-colors">
            <Camera className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-500">Click to upload a photo</p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-bold text-[#0F172A] mb-2">Physical Description</label>
        <textarea
          placeholder="Height, clothing color, hair, identifying marks..."
          rows={4}
          value={data.description}
          onChange={(e) => onChange('description', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 resize-none"
        />
      </div>
    </div>
  )
}

function Step4({ data, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-[#0F172A] mb-2">Your Phone Number</label>
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="tel" placeholder="+91 98765 43210"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            className="w-full pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">Rescue teams will use this to contact you with updates</p>
      </div>
      <div>
        <label className="block text-sm font-bold text-[#0F172A] mb-2">Alternate Contact (optional)</label>
        <input
          type="tel" placeholder="Another number we can reach you at"
          value={data.altPhone}
          onChange={(e) => onChange('altPhone', e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
        />
      </div>
      <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-slate-50 transition-colors">
        <input
          type="checkbox"
          checked={data.consent}
          onChange={(e) => onChange('consent', e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-[#1E3A8A]"
        />
        <span className="text-sm text-[#475569] leading-relaxed">
          I confirm the information provided is accurate and consent to sharing it with rescue authorities for the purpose of locating this person.
        </span>
      </label>
    </div>
  )
}

function Confirmation({ refId, personName, reportId }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-8 space-y-4"
    >
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-8 h-8 text-emerald-600" />
      </div>
      <h2 className="text-2xl font-bold text-[#0F172A]" style={{ fontFamily: 'var(--font-heading)' }}>
        Report Submitted
      </h2>
      <p className="text-[#475569] max-w-sm mx-auto text-sm leading-relaxed">
        Your report for <strong>{personName}</strong> has been received. Our team will begin searching and contact you with any updates.
      </p>
      <div className="bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 rounded-xl px-6 py-4 inline-block">
        <p className="text-xs text-[#475569] font-medium uppercase tracking-wide mb-1">Reference ID</p>
        <p className="text-xl font-bold text-[#1E3A8A]">{refId}</p>
      </div>
      <p className="text-xs text-slate-400">Save this ID to track your report status</p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link
          to={`/track/${refId}`}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-sm font-semibold hover:bg-[#162D6B] transition-colors"
        >
          Track Progress
        </Link>
        {reportId && (
          <Link
            to={`/results/${reportId}`}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-200 text-[#1E3A8A] text-sm font-semibold hover:bg-[#1E3A8A]/5 transition-colors"
          >
            View Match Analysis
          </Link>
        )}
      </div>
    </motion.div>
  )
}

export default function ReportPage() {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [refId, setRefId] = useState('')
  const [reportId, setReportId] = useState('')

  const [form, setForm] = useState({
    name: '', age: '', gender: '', relationship: '',
    location: '', date: '', time: '', state: '', district: '', customDistrict: '',
    description: '',
    photoFile: null,
    phone: '', altPhone: '', consent: false,
  })

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  const stepData = [
    { name: form.name, age: form.age, gender: form.gender, relationship: form.relationship },
    { location: form.location, date: form.date, time: form.time, state: form.state, district: form.district, customDistrict: form.customDistrict },
    { description: form.description, photoFile: form.photoFile },
    { phone: form.phone, altPhone: form.altPhone, consent: form.consent },
  ]

  const canNext = () => {
    if (step === 0) return form.name.trim() && form.age
    if (step === 1) {
      const validDistrict = form.district === 'Other' ? form.customDistrict.trim() : form.district
      return form.location.trim() && form.state && validDistrict
    }
    if (step === 2) return form.description.trim()
    if (step === 3) return form.phone.trim() && form.consent
    return true
  }

  const handleSubmit = async () => {
    if (!canNext()) return
    setSubmitting(true)
    setError(null)
    try {
      const submitData = { ...form }
      if (submitData.district === 'Other') {
        submitData.district = submitData.customDistrict
      }
      delete submitData.customDistrict

      const result = await submitMissingPersonReport(submitData)
      setRefId(result.refId)
      setReportId(result.id)
      setSubmitted(true)
    } catch (err) {
      console.error('Submit error:', err)
      setError(err?.message || 'Failed to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-5 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-body)' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {!submitted && (
          <>
            <h1 className="text-3xl font-bold text-[#0F172A] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
              Report Missing Person
            </h1>
            <p className="text-[#475569] mb-8 text-sm">Please provide as much detail as you can. This helps us search faster.</p>
            <StepIndicator current={step} />
          </>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          {submitted ? (
            <Confirmation refId={refId} personName={form.name} reportId={reportId} />
          ) : (
            <>
              <h2 className="text-lg font-bold text-[#0F172A] mb-6 flex items-center gap-2">
                <span className="text-sm bg-[#1E3A8A]/10 text-[#1E3A8A] px-2 py-0.5 rounded-full font-bold">
                  Step {step + 1} / {STEPS.length}
                </span>
                {STEPS[step].title}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                >
                  {step === 0 && <Step1 data={stepData[0]} onChange={setField} />}
                  {step === 1 && <Step2 data={stepData[1]} onChange={setField} />}
                  {step === 2 && <Step3 data={stepData[2]} onChange={setField} />}
                  {step === 3 && <Step4 data={stepData[3]} onChange={setField} />}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                {step > 0 ? (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-[#475569] hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : <div />}

                {step < STEPS.length - 1 ? (
                  <motion.button
                    whileHover={{ scale: canNext() ? 1.03 : 1 }}
                    whileTap={{ scale: canNext() ? 0.97 : 1 }}
                    onClick={() => canNext() && setStep((s) => s + 1)}
                    className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors
                      ${canNext() ? 'bg-[#1E3A8A] hover:bg-[#162D6B] text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: canNext() && !submitting ? 1.03 : 1 }}
                    whileTap={{ scale: canNext() && !submitting ? 0.97 : 1 }}
                    onClick={handleSubmit}
                    disabled={submitting || !canNext()}
                    className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors
                      ${canNext() && !submitting ? 'bg-[#FB7185] hover:bg-[#f43f5e] text-white shadow-md shadow-[#FB7185]/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                      : <><Check className="w-4 h-4" /> Submit Report</>
                    }
                  </motion.button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
