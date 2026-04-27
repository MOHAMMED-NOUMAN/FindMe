import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { submitSafeReport } from "../firebase/safeReports";

const statusOptions = [
  { value: "safe", translationKey: "safe" },
  { value: "safe_needs_help", translationKey: "safe_needs_help" },
  { value: "at_relief_camp", translationKey: "at_relief_camp" },
  { value: "medical_help", translationKey: "medical_help" },
];

export default function SafePage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    relativePhone: "",
    relativeMessage: "",
    missingReportRef: "",
    status: "safe",
    district: "",
    location: "",
    message: "",
    latitude: null,
    longitude: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState(null);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const canSubmit = form.name.trim() && form.phone.trim();

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(t("safe_page.errors.no_location"));
      return;
    }

    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setForm((current) => ({
          ...current,
          latitude,
          longitude,
          // Keep a human-readable coordinate string in the location field.
          location:
            current.location?.trim() ||
            `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        }));
        setLocating(false);
      },
      () => {
        setError(t("safe_page.errors.location_failed"));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await submitSafeReport(form);
      setSubmitted(result);
    } catch (err) {
      console.error("Safe status submit error:", err);
      setError(err?.message || t("safe_page.errors.submit_failed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen pt-28 pb-20 px-5 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{t("safe_page.success.title")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {t("safe_page.success.message")}
          </p>
          <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
              {t("safe_page.success.ref_id")}
            </p>
            <p className="mt-1 text-xl font-bold text-emerald-900">
              {submitted.refId}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 px-5" style={{ fontFamily: "var(--font-body)" }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl"
      >
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            {t("safe_page.badge")}
          </div>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            {t("safe_page.title")}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {t("safe_page.subtitle")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-900">
                {t("safe_page.form.full_name")}
              </label>
              <input
                value={form.name}
                onChange={(event) => setField("name", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder={t("safe_page.form.full_name_placeholder")}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-900">
                {t("safe_page.form.phone")}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.phone}
                  onChange={(event) => setField("phone", event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder={t("safe_page.form.phone_placeholder")}
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold text-slate-900">
              {t("safe_page.form.safety_status")}
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setField("status", option.value)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                    form.status === option.value
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {t(`safe_page.status.${option.translationKey}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-900">
                {t("safe_page.form.district")}
              </label>
              <input
                value={form.district}
                onChange={(event) => setField("district", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder={t("safe_page.form.district_placeholder")}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-900">
                {t("safe_page.form.location")}
              </label>
              <input
                value={form.location}
                onChange={(event) => setField("location", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder={t("safe_page.form.location_placeholder")}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-900">
                {t("safe_page.form.relative_phone")}
              </label>
              <input
                value={form.relativePhone}
                onChange={(event) => setField("relativePhone", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                placeholder={t("safe_page.form.relative_phone_placeholder")}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {form.latitude != null && form.longitude != null
              ? t("safe_page.form.location_attached")
              : t("safe_page.form.attach_location")}
          </button>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold text-slate-900">
              {t("safe_page.form.relative_message")}
            </label>
            <textarea
              value={form.relativeMessage}
              onChange={(event) => setField("relativeMessage", event.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder={t("safe_page.form.relative_message_placeholder")}
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold text-slate-900">
              {t("safe_page.form.rescue_message")}
            </label>
            <textarea
              value={form.message}
              onChange={(event) => setField("message", event.target.value)}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder={t("safe_page.form.rescue_message_placeholder")}
            />
          </div>

          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {t("safe_page.form.share_btn")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
