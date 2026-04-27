import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Camera, Check, Loader2, X } from 'lucide-react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase/config'
import { ensureAnonymousAuth } from '../firebase/authService'

export default function ReportFoundPage() {
  const { t } = useTranslation()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: '',
    tags: '',
    locationDesc: '',
    photoFile: null,
    previewUrl: null,
  })

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setField('photoFile', file)
    setField('previewUrl', URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      await ensureAnonymousAuth()

      let photoUrl = null
      if (form.photoFile) {
        try {
          const fileExt = form.photoFile.name.split('.').pop() || 'jpg'
          const refId = `found-${Date.now()}`
          const fileName = `found_persons/${refId}/photo_${Math.random().toString(36).substring(2)}.${fileExt}`
          const storageRef = ref(storage, fileName)
          const metadata = { contentType: form.photoFile.type }
          storage.maxUploadRetryTime = 3000
          await uploadBytes(storageRef, form.photoFile, metadata)
          photoUrl = await getDownloadURL(storageRef)
        } catch (storageErr) {
          console.warn('Storage upload failed (likely CORS or rules), falling back to no photo:', storageErr)
        }
      }

      const tagsArray = form.tags
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      let lat = null, lng = null
      if (form.locationDesc.trim()) {
        try {
          const query = encodeURIComponent(form.locationDesc.trim() + ', India')
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat)
            lng = parseFloat(data[0].lon)
          }
        } catch (err) {
          console.warn('Geocoding error', err)
        }
      }

      const docData = {
        name: form.name.trim() || null,
        age: parseInt(form.age) || null,
        gender: form.gender || null,
        physical_tags: tagsArray,
        location: {
          description: form.locationDesc.trim() || null,
          latitude: lat,
          longitude: lng,
        },
        photo_url: photoUrl,
        status: 'found',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await addDoc(collection(db, 'found_persons'), docData)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError(err?.message || t('report_found_page.submit_error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-5 max-w-2xl mx-auto flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2
            className="text-2xl font-bold text-[#0F172A]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {t('report_found_page.confirmation_title')}
          </h2>
          <p className="text-[#475569] max-w-sm mx-auto text-sm leading-relaxed">
            {t('report_found_page.confirmation_msg')}
          </p>
          <button
            onClick={() => {
              setSubmitted(false)
              setForm({ name: '', age: '', gender: '', tags: '', locationDesc: '', photoFile: null, previewUrl: null })
            }}
            className="mt-4 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
          >
            {t('report_found_page.submit_another')}
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen pt-28 pb-20 px-5 max-w-2xl mx-auto"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className="text-3xl font-bold text-[#0F172A] mb-1"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {t('report_found_page.title')}
        </h1>
        <p className="text-[#475569] mb-8 text-sm">{t('report_found_page.subtitle')}</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-bold text-[#0F172A] mb-2">
                {t('report_found_page.name_label')}
              </label>
              <input
                type="text"
                placeholder={t('report_found_page.name_placeholder')}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>

            {/* Age + Gender */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-2">
                  {t('report_found_page.age_label')}
                </label>
                <input
                  type="number"
                  placeholder="e.g. 34"
                  value={form.age}
                  onChange={(e) => setField('age', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0F172A] mb-2">
                  {t('report_found_page.gender_label')}
                </label>
                <select
                  value={form.gender}
                  onChange={(e) => setField('gender', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                >
                  <option value="">{t('report_found_page.select')}</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            {/* Physical Tags */}
            <div>
              <label className="block text-sm font-bold text-[#0F172A] mb-2">
                {t('report_found_page.tags_label')}
              </label>
              <input
                type="text"
                placeholder={t('report_found_page.tags_placeholder')}
                value={form.tags}
                onChange={(e) => setField('tags', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-bold text-[#0F172A] mb-2">
                {t('report_found_page.location_label')}
              </label>
              <input
                type="text"
                placeholder={t('report_found_page.location_placeholder')}
                value={form.locationDesc}
                onChange={(e) => setField('locationDesc', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>

            {/* Photo */}
            <div>
              <label className="block text-sm font-bold text-[#0F172A] mb-2">
                {t('report_found_page.upload_label')}
              </label>
              {form.previewUrl ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-200">
                  <img src={form.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => { setField('previewUrl', null); setField('photoFile', null) }}
                    className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <label className="block w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:bg-slate-50 hover:border-slate-400 transition-colors">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm font-medium text-slate-500">{t('report_found_page.click_upload')}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('report_found_page.file_hint')}</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
            <motion.button
              whileHover={{ scale: !submitting ? 1.03 : 1 }}
              whileTap={{ scale: !submitting ? 0.97 : 1 }}
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors
                ${!submitting
                  ? 'bg-[#1E3A8A] hover:bg-[#162D6B] text-white shadow-md shadow-[#1E3A8A]/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('report_found_page.submitting')}</>
                : <><Check className="w-4 h-4" /> {t('report_found_page.submit')}</>
              }
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
