import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import {
  confirmSafeReportMatch,
  findMissingPersonMatches,
  markSafeReportReviewed,
  subscribeSafeReports,
} from "../../firebase/safeReports";

const statusLabels = {
  safe: "Safe",
  safe_needs_help: "Safe, needs help",
  at_relief_camp: "At relief camp",
  medical_help: "Medical help",
};

const statusStyles = {
  safe: "bg-emerald-50 text-emerald-700 border-emerald-200",
  safe_needs_help: "bg-amber-50 text-amber-700 border-amber-200",
  at_relief_camp: "bg-blue-50 text-blue-700 border-blue-200",
  medical_help: "bg-rose-50 text-rose-700 border-rose-200",
};

function formatTime(value) {
  const date = value?.toDate ? value.toDate() : null;
  if (!date) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(date);
}

export default function SafeReports({ user }) {
  const [reports, setReports] = useState([]);
  const [matchesByReport, setMatchesByReport] = useState({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    return subscribeSafeReports(
      (items) => {
        setReports(items);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || "Could not load safe reports.");
        setLoading(false);
      },
    );
  }, []);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reports.filter((report) => {
      if (!term) return true;
      return [report.name, report.phone, report.refId, report.district, report.location]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [reports, search]);

  const stats = useMemo(
    () => ({
      total: reports.length,
      newCount: reports.filter((report) => report.reviewStatus === "new").length,
      linked: reports.filter((report) => report.reviewStatus === "linked").length,
      medical: reports.filter((report) => report.status === "medical_help").length,
    }),
    [reports],
  );

  const loadMatches = async (report) => {
    setBusyId(report.id);
    setError(null);
    try {
      const matches = await findMissingPersonMatches(report);
      setMatchesByReport((current) => ({ ...current, [report.id]: matches }));
    } catch (err) {
      setError(err?.message || "Could not search missing-person matches.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReviewed = async (report) => {
    setBusyId(report.id);
    setError(null);
    try {
      await markSafeReportReviewed(report.id, user);
    } catch (err) {
      setError(err?.message || "Could not mark this safe report reviewed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmMatch = async (report, missingPerson) => {
    setBusyId(report.id);
    setError(null);
    try {
      await confirmSafeReportMatch(report, missingPerson, user);
    } catch (err) {
      setError(err?.message || "Could not link this report.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4" style={{ fontFamily: "var(--font-body)" }}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            Safe check-ins
          </div>
          <h2 className="mt-2 text-lg font-bold tracking-wide text-slate-900">
            I Am Safe Reports
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: "Total", value: stats.total, icon: ShieldCheck },
          { label: "New", value: stats.newCount, icon: Clock },
          { label: "Linked", value: stats.linked, icon: CheckCircle2 },
          { label: "Medical", value: stats.medical, icon: Stethoscope },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {item.label}
                </span>
                <Icon className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="mt-1 text-xl font-bold text-slate-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="relative rounded-xl border border-slate-200 bg-white">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-xl py-3 pl-9 pr-3 text-sm focus:outline-none"
          placeholder="Search name, phone, reference, district"
        />
      </div>

      <div className="flex-1 min-h-[280px] overflow-y-auto space-y-3 pr-1">
        {loading && (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}

        {!loading && filteredReports.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
            <ShieldCheck className="mx-auto mb-2 h-5 w-5 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">
              No safe reports yet.
            </p>
          </div>
        )}

        {filteredReports.map((report, index) => {
          const matches = matchesByReport[report.id] || [];
          const linked = report.reviewStatus === "linked";
          return (
            <motion.article
              key={report.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.015, 0.18) }}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      {report.name}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      {report.refId}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles[report.status] || statusStyles.safe}`}
                    >
                      {statusLabels[report.status] || "Safe"}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
                    <span>{formatTime(report.createdAt)}</span>
                    {report.phone && <span>{report.phone}</span>}
                    {report.missingReportRef && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        Missing Ref {report.missingReportRef}
                      </span>
                    )}
                    {report.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {report.location}
                      </span>
                    )}
                  </div>
                </div>
                {linked && (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                    Linked
                  </span>
                )}
              </div>

              {report.message && (
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {report.message}
                </p>
              )}

              {report.relativeContact?.phone && (
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  Relative phone: {report.relativeContact.phone}
                </p>
              )}

              {report.relativeContact?.message && (
                <p className="mt-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-2 text-xs leading-relaxed text-emerald-900">
                  Relative message: {report.relativeContact.message}
                </p>
              )}

              {report.coordinates && (
                <p className="mt-2 text-[11px] font-medium text-slate-500">
                  GPS: {report.coordinates.latitude.toFixed(5)},{" "}
                  {report.coordinates.longitude.toFixed(5)}
                </p>
              )}

              {!linked && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => loadMatches(report)}
                    disabled={busyId === report.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                  >
                    {busyId === report.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                    Find Matches
                  </button>
                  <button
                    onClick={() => handleReviewed(report)}
                    disabled={busyId === report.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Mark Reviewed
                  </button>
                </div>
              )}

              {matches.length > 0 && !linked && (
                <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                  {matches.map((match) => (
                    <div
                      key={match.id}
                      className="flex flex-col gap-2 rounded-lg bg-white p-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          {match.name || "Unknown"}{" "}
                          {match.refId ? `(${match.refId})` : ""}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {match.lastKnownLocation?.description ||
                            match.lastKnownLocation?.district ||
                            "No location"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleConfirmMatch(report, match)}
                        disabled={busyId === report.id}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Confirm Safe
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
