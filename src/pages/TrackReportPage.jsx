import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileSearch,
  Loader2,
  MapPin,
  Radio,
  Search,
  ShieldCheck,
  User,
  RefreshCw,
} from "lucide-react";
import { subscribeMissingPersonByReference } from "../firebase/missingPersons";
import { useTranslation } from "react-i18next";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  missing: {
    labelKey: "status_active",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-700 border border-amber-200",
    pulse: true,
  },
  found: {
    labelKey: "status_found",
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pulse: false,
  },
  closed: {
    labelKey: "status_closed",
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-600 border border-slate-200",
    pulse: false,
  },
};

// ── Date formatter ────────────────────────────────────────────────────────────
function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// ── Build progress steps from report data ────────────────────────────────────
function buildSteps(report, t) {
  const hasScore = typeof report?.composite_score === "number";
  const hasMatch = Boolean(report?.found_person_id || report?.matchedWith);
  const isFound = report?.status === "found";

  return [
    {
      title: t("track_page.step_received_title"),
      description: t("track_page.step_received_desc"),
      state: "done",
      icon: ClipboardCheck,
    },
    {
      title: t("track_page.step_ai_title"),
      description:
        hasScore || hasMatch
          ? t("track_page.step_ai_desc_done")
          : t("track_page.step_ai_desc_pending"),
      state: hasScore || hasMatch || isFound ? "done" : "active",
      icon: FileSearch,
    },
    {
      title: t("track_page.step_rescue_title"),
      description: isFound
        ? t("track_page.step_rescue_desc_done")
        : t("track_page.step_rescue_desc_pending"),
      state: isFound ? "done" : hasScore || hasMatch ? "active" : "pending",
      icon: Radio,
    },
    {
      title: t("track_page.step_resolution_title"),
      description: isFound
        ? t("track_page.step_resolution_desc_done")
        : t("track_page.step_resolution_desc_pending"),
      state: isFound ? "done" : "pending",
      icon: CheckCircle2,
    },
  ];
}

// ── Individual step ───────────────────────────────────────────────────────────
function ProgressStep({ step, isLast, index }) {
  const Icon = step.icon;
  const done = step.state === "done";
  const active = step.state === "active";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className="relative flex gap-4"
    >
      {/* Connector line */}
      {!isLast && (
        <div
          className={`absolute left-5 top-11 h-[calc(100%-1.5rem)] w-0.5 transition-colors duration-700 ${
            done ? "bg-[#1E3A8A]" : "bg-slate-100"
          }`}
        />
      )}

      {/* Icon bubble */}
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
          done
            ? "bg-[#1E3A8A] text-white shadow-md shadow-[#1E3A8A]/25"
            : active
            ? "border-2 border-[#FB7185] bg-rose-50 text-[#FB7185]"
            : "border-2 border-slate-200 bg-white text-slate-300"
        }`}
      >
        {active && (
          <span className="absolute inset-0 animate-ping rounded-full bg-[#FB7185]/20" />
        )}
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="pb-7 pt-1 min-w-0">
        <p
          className={`text-sm font-bold ${
            done ? "text-[#0F172A]" : active ? "text-[#FB7185]" : "text-slate-400"
          }`}
        >
          {step.title}
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-500">{step.description}</p>
      </div>
    </motion.div>
  );
}

// ── Info chip ─────────────────────────────────────────────────────────────────
function InfoChip({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-[#0F172A] truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TrackReportPage() {
  const { t } = useTranslation();
  const { refId: routeRefId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(routeRefId || "");
  const [lookupRef, setLookupRef] = useState(routeRefId || "");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(Boolean(routeRefId));
  const [searched, setSearched] = useState(Boolean(routeRefId));
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  // ── Real-time subscription ──────────────────────────────────────────────
  useEffect(() => {
    if (!lookupRef) return undefined;
    setLoading(true);
    setError(null);
    setReport(null);

    const unsubscribe = subscribeMissingPersonByReference(
      lookupRef,
      (nextReport) => {
        setReport(nextReport);
        setLoading(false);
        setLastChecked(new Date());
      },
      (err) => {
        console.error("Reference lookup failed:", err);
        setError("Could not fetch this report right now. Please try again.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [lookupRef]);

  const steps = useMemo(() => (report ? buildSteps(report, t) : []), [report, t]);
  const status = STATUS_CONFIG[report?.status] || STATUS_CONFIG.missing;

  // Pull address from locationCoords first, then fall back to lastKnownLocation
  const locationText =
    report?.locationCoords?.address ||
    [report?.lastKnownLocation?.description, report?.lastKnownLocation?.district]
      .filter(Boolean)
      .join(", ") ||
    null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextRef = input.trim();
    if (!nextRef) return;
    setSearched(true);
    setLookupRef(nextRef);
    navigate(`/track/${encodeURIComponent(nextRef.replace(/\s+/g, "").toUpperCase())}`);
  };

  return (
    <div
      className="min-h-screen px-4 pb-20 pt-28"
      style={{ fontFamily: "var(--font-body)", background: "linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)" }}
    >
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid gap-5 lg:grid-cols-[420px_1fr] lg:items-start"
        >
          {/* ── LEFT: Search panel ──────────────────────────────────────── */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/80 bg-white p-6 shadow-sm sm:p-8">
              {/* Icon + heading */}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E3A8A]/10 text-[#1E3A8A]">
                <Search className="h-5 w-5" />
              </div>
              <h1
                className="text-2xl font-bold text-[#0F172A]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {t('track_page.title')}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {t('track_page.subtitle')}
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                <label htmlFor="reference" className="block text-xs font-bold uppercase tracking-widest text-slate-400">
                  {t('track_page.ref_label')}
                </label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    id="reference"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="FM-A3B9C1"
                    autoComplete="off"
                    className="min-h-[46px] flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold uppercase tracking-widest text-[#0F172A] outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/20"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-bold text-white shadow-md shadow-[#1E3A8A]/20 transition hover:bg-[#162D6B] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    {t('track_page.check_btn')}
                  </button>
                </div>
              </form>

              {/* Last checked */}
              {lastChecked && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <RefreshCw className="h-3 w-3" />
                  {t('track_page.last_updated')} {lastChecked.toLocaleTimeString("en-IN")}
                </p>
              )}
            </div>

            {/* Privacy notice */}
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />
                <p className="text-xs leading-relaxed text-slate-500">
                  {t('track_page.privacy_note')}
                </p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Results panel ─────────────────────────────────────── */}
          <div className="rounded-2xl border border-white/80 bg-white shadow-sm overflow-hidden">
            <AnimatePresence mode="wait">
              {/* Empty state */}
              {!searched && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[440px] flex-col items-center justify-center gap-4 p-8 text-center"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                    <Search className="h-7 w-7 text-slate-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500">{t('track_page.no_report_title')}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Enter a reference number on the left to view live case status.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Loading */}
              {searched && loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[440px] flex-col items-center justify-center gap-4 p-8"
                >
                  <Loader2 className="h-9 w-9 animate-spin text-[#1E3A8A]" />
                  <p className="text-sm font-semibold text-slate-500">{t('track_page.checking')}</p>
                </motion.div>
              )}

              {/* Error */}
              {searched && !loading && error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[440px] flex-col items-center justify-center gap-4 p-8 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                    <AlertCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">Error</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Not found */}
              {searched && !loading && !error && !report && (
                <motion.div
                  key="notfound"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[440px] flex-col items-center justify-center gap-4 p-8 text-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
                    <AlertCircle className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#0F172A]">{t('track_page.no_report_title')}</p>
                    <p className="mt-1 max-w-xs text-sm leading-relaxed text-slate-500">
                      {t('track_page.no_report_hint')}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Report found */}
              {report && !loading && (
                <motion.div
                  key="report"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Header band */}
                  <div className="border-b border-slate-100 bg-gradient-to-r from-[#1E3A8A]/5 to-transparent px-6 py-5 sm:px-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          {t('track_page.reference_label')}
                        </p>
                        <h2
                          className="mt-0.5 text-2xl font-bold tracking-tight text-[#0F172A]"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {report.refId}
                        </h2>
                        {report.name && (
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                            <User className="h-3.5 w-3.5" />
                            {report.name}
                            {report.age ? `, ${report.age}` : ""}
                            {report.gender ? ` · ${report.gender}` : ""}
                          </p>
                        )}
                      </div>

                      {/* Status pill */}
                      <div
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${status.pill}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${status.dot} ${
                            status.pulse ? "animate-pulse" : ""
                          }`}
                        />
                        {t(`track_page.${status.labelKey}`)}
                      </div>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-3 border-b border-slate-100 px-6 py-5 sm:grid-cols-2 sm:px-8">
                    <InfoChip
                      icon={Clock}
                      label={t("track_page.last_updated")}
                      value={formatDate(report.updatedAt || report.createdAt)}
                    />
                    <InfoChip
                      icon={Calendar}
                      label={t("track_page.reported_on")}
                      value={formatDate(report.createdAt)}
                    />
                    {report.lastKnownLocation?.dateLastSeen && (
                      <InfoChip
                        icon={Calendar}
                        label={t("report_page.date_seen")}
                        value={report.lastKnownLocation.dateLastSeen}
                      />
                    )}
                    {(report.lastKnownLocation?.district || report.lastKnownLocation?.description) && (
                      <InfoChip
                        icon={MapPin}
                        label={t("report_page.district")}
                        value={report.lastKnownLocation.district || report.lastKnownLocation.description}
                      />
                    )}
                  </div>

                  {/* Location address */}
                  {locationText && (
                    <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/50 px-6 py-4 sm:px-8">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />
                      <p className="text-sm leading-relaxed text-slate-600">{locationText}</p>
                    </div>
                  )}

                  {/* Progress timeline */}
                  <div className="px-6 py-6 sm:px-8">
                    <p className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">
                      {t('track_page.case_timeline')}
                    </p>
                    <div>
                      {steps.map((step, i) => (
                        <ProgressStep
                          key={step.title}
                          step={step}
                          isLast={i === steps.length - 1}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Found banner */}
                  {report.status === "found" && (
                    <div className="mx-6 mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 sm:mx-8">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-emerald-800">{t('track_page.person_located')}</p>
                          <p className="text-xs text-emerald-700">
                            {report.resolvedBy?.name
                              ? `Verified by ${report.resolvedBy.name}`
                              : t('track_page.case_resolved_msg')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
