import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileSearch,
  Loader2,
  MapPin,
  Radio,
  Search,
  ShieldCheck,
} from "lucide-react";
import { subscribeMissingPersonByReference } from "../firebase/missingPersons";

function formatDate(value) {
  if (!value) return null; // handled via t() at callsite
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

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
      description: hasScore || hasMatch
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

function ProgressStep({ step, isLast }) {
  const Icon = step.icon;
  const done = step.state === "done";
  const active = step.state === "active";

  return (
    <div className="relative flex gap-4">
      {!isLast && (
        <div className={`absolute left-5 top-11 h-[calc(100%-1.25rem)] w-0.5 ${done ? "bg-[#1E3A8A]" : "bg-slate-200"}`} />
      )}
      <div
        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
          done
            ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
            : active
              ? "border-[#FB7185] bg-[#FB7185]/10 text-[#FB7185]"
              : "border-slate-200 bg-white text-slate-400"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="pb-7">
        <p className="text-sm font-bold text-[#0F172A]">{step.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-[#475569]">{step.description}</p>
      </div>
    </div>
  );
}

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

  const STATUS_COPY = {
    missing: { label: t("track_page.status_active"), tone: "bg-amber-50 text-amber-700 border-amber-200" },
    found:   { label: t("track_page.status_found"),  tone: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    closed:  { label: t("track_page.status_closed"), tone: "bg-slate-100 text-slate-700 border-slate-200" },
  };

  useEffect(() => {
    if (!lookupRef) return undefined;
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeMissingPersonByReference(
      lookupRef,
      (nextReport) => {
        setReport(nextReport);
        setLoading(false);
      },
      (err) => {
        console.error("Reference lookup failed:", err);
        setError(t("track_page.lookup_error"));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [lookupRef, t]);

  const steps = useMemo(() => (report ? buildSteps(report, t) : []), [report, t]);
  const status = STATUS_COPY[report?.status] || STATUS_COPY.missing;
  const location = [
    report?.lastKnownLocation?.description,
    report?.lastKnownLocation?.district,
  ].filter(Boolean).join(", ");

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextRef = input.trim();
    if (!nextRef) return;
    setSearched(true);
    setLookupRef(nextRef);
    navigate(`/track/${encodeURIComponent(nextRef.replace(/\s+/g, "").toUpperCase())}`);
  };

  return (
    <div className="min-h-screen px-5 pb-16 pt-28" style={{ fontFamily: "var(--font-body)" }}>
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:items-start"
        >
          {/* Left: Input panel */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E3A8A]/8 text-[#1E3A8A]">
              <Search className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-heading)" }}>
              {t("track_page.title")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#475569]">
              {t("track_page.subtitle")}
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-3">
              <label htmlFor="reference" className="block text-sm font-bold text-[#0F172A]">
                {t("track_page.ref_label")}
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="reference"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="FM-A3B9C1"
                  className="min-h-12 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold uppercase tracking-wide text-[#0F172A] outline-none transition focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/20"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#162D6B] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {t("track_page.check_btn")}
                </button>
              </div>
            </form>

            <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1E3A8A]" />
                <p className="text-sm leading-relaxed text-[#475569]">
                  {t("track_page.privacy_note")}
                </p>
              </div>
            </div>
          </section>

          {/* Right: Results panel */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {!searched && (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <Clock3 className="mb-4 h-10 w-10 text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">{t("track_page.enter_ref_prompt")}</p>
              </div>
            )}

            {searched && loading && (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <Loader2 className="mb-4 h-9 w-9 animate-spin text-[#1E3A8A]" />
                <p className="text-sm font-semibold text-slate-500">{t("track_page.checking")}</p>
              </div>
            )}

            {searched && !loading && error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {searched && !loading && !error && !report && (
              <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <AlertCircle className="mb-4 h-10 w-10 text-amber-500" />
                <h2 className="text-lg font-bold text-[#0F172A]">{t("track_page.no_report_title")}</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#475569]">
                  {t("track_page.no_report_hint")}
                </p>
              </div>
            )}

            {report && !loading && (
              <div>
                <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      {t("track_page.reference_label")}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-[#0F172A]" style={{ fontFamily: "var(--font-heading)" }}>
                      {report.refId}
                    </h2>
                    <p className="mt-1 text-sm text-[#475569]">
                      {report.name || t("track_page.missing_person_report")}
                    </p>
                  </div>
                  <span className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-bold ${status.tone}`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid gap-3 border-b border-slate-100 py-5 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {t("track_page.last_updated")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#0F172A]">
                      {formatDate(report.updatedAt || report.createdAt) || t("common.not_available")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      {t("track_page.reported_on")}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#0F172A]">
                      {formatDate(report.createdAt) || t("common.not_available")}
                    </p>
                  </div>
                </div>

                {location && (
                  <div className="flex items-start gap-2 border-b border-slate-100 py-5 text-sm text-[#475569]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />
                    <span>{location}</span>
                  </div>
                )}

                <div className="pt-6">
                  {steps.map((step, index) => (
                    <ProgressStep key={step.title} step={step} isLast={index === steps.length - 1} />
                  ))}
                </div>

                <div className="mt-2 flex flex-wrap gap-3">
                  <Link
                    to={`/results/${report.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-[#1E3A8A] transition hover:bg-[#1E3A8A]/5"
                  >
                    {t("track_page.view_match")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </section>
        </motion.div>
      </div>
    </div>
  );
}
