import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  MapPin,
  Plus,
  Radio,
  Search,
  Send,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  addExchangeItemToSearchBoard,
  addRescueExchangeUpdate,
  EXCHANGE_PRIORITY,
  EXCHANGE_STATUS,
  subscribeOpenMissingPersonOptions,
  subscribeRescueExchange,
} from "../../firebase/rescueExchange";

const statusLabels = {
  needs_help: "Needs help",
  sighting: "Sighting",
  verified: "Verified",
  rescued: "Rescued",
  unresolved: "Unresolved",
};

const statusStyles = {
  needs_help: "bg-red-50 text-red-700 border-red-200",
  sighting: "bg-amber-50 text-amber-700 border-amber-200",
  verified: "bg-blue-50 text-blue-700 border-blue-200",
  rescued: "bg-emerald-50 text-emerald-700 border-emerald-200",
  unresolved: "bg-slate-100 text-slate-700 border-slate-200",
};

const emptyForm = {
  missingPersonId: "",
  personName: "",
  caseRef: "",
  status: "needs_help",
  priority: "HIGH",
  sourceType: "field",
  district: "",
  location: "",
  displacementZone: "",
  teamName: "",
  note: "",
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

export default function RescueExchange({ user }) {
  const [updates, setUpdates] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addingId, setAddingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
  });

  useEffect(() => {
    const unsubUpdates = subscribeRescueExchange(
      (items) => {
        setUpdates(items);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || "Could not load shared updates.");
        setLoading(false);
      },
    );

    const unsubCases = subscribeOpenMissingPersonOptions(setCases, () => {});

    return () => {
      unsubUpdates();
      unsubCases();
    };
  }, []);

  const filteredUpdates = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return updates.filter((item) => {
      const matchesSearch =
        !term ||
        [
          item.personName,
          item.caseRef,
          item.district,
          item.location,
          item.note,
          item.teamName,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      const matchesStatus =
        filters.status === "all" || item.status === filters.status;
      const matchesPriority =
        filters.priority === "all" || item.priority === filters.priority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [filters, updates]);

  const stats = useMemo(
    () => ({
      total: updates.length,
      urgent: updates.filter((item) => item.priority === "CRITICAL").length,
      rescued: updates.filter((item) => item.status === "rescued").length,
      activeTeams: new Set(updates.map((item) => item.teamName).filter(Boolean))
        .size,
    }),
    [updates],
  );

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleCaseSelect = (id) => {
    const selected = cases.find((item) => item.id === id);
    setForm((current) => ({
      ...current,
      missingPersonId: id,
      personName: selected?.name || current.personName,
      caseRef: selected?.refId || current.caseRef,
      district: selected?.district || current.district,
      location: selected?.location || current.location,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await addRescueExchangeUpdate(form, user);
      setForm(emptyForm);
    } catch (err) {
      setError(err?.message || "Could not share this update.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToSearchBoard = async (item) => {
    setAddingId(item.id);
    setError(null);

    try {
      await addExchangeItemToSearchBoard(item, user);
    } catch (err) {
      setError(err?.message || "Could not add this update to the search board.");
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4" style={{ fontFamily: "var(--font-body)" }}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
            <Radio className="w-3.5 h-3.5" />
            Rescuer data sharing
          </div>
          <h2 className="mt-2 text-lg font-bold tracking-wide text-slate-900">
            Shared Field Exchange
          </h2>
        </div>
        <button
          onClick={() => setFormOpen((value) => !value)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-slate-800"
        >
          <Plus className="w-3.5 h-3.5" />
          Share Update
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {[
          { label: "Updates", value: stats.total, icon: Users },
          { label: "Critical", value: stats.urgent, icon: AlertTriangle },
          { label: "Rescued", value: stats.rescued, icon: ShieldCheck },
          { label: "Teams", value: stats.activeTeams, icon: CheckCircle2 },
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

      {formOpen && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-3 space-y-3"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Link Case
              </label>
              <select
                value={form.missingPersonId}
                onChange={(event) => handleCaseSelect(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <option value="">Manual / unlinked update</option>
                {cases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.refId ? `${item.refId} - ` : ""}
                    {item.name}
                    {item.district ? `, ${item.district}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Person Name
              </label>
              <input
                required
                value={form.personName}
                onChange={(event) => setField("personName", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Name or unknown person"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(event) => setField("status", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {EXCHANGE_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(event) => setField("priority", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {EXCHANGE_PRIORITY.map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Source
              </label>
              <select
                value={form.sourceType}
                onChange={(event) => setField("sourceType", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="field">Field</option>
                <option value="web">Web</option>
                <option value="ivr">IVR</option>
                <option value="ngo">NGO</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1">
                Team
              </label>
              <input
                value={form.teamName}
                onChange={(event) => setField("teamName", event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Team Alpha"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <input
              value={form.district}
              onChange={(event) => setField("district", event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="District"
            />
            <input
              value={form.displacementZone}
              onChange={(event) =>
                setField("displacementZone", event.target.value)
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Zone / camp"
            />
            <input
              value={form.caseRef}
              onChange={(event) => setField("caseRef", event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              placeholder="Reference ID"
            />
          </div>

          <input
            value={form.location}
            onChange={(event) => setField("location", event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Exact location, landmark, or last seen point"
          />

          <div className="flex flex-col lg:flex-row gap-3">
            <textarea
              value={form.note}
              onChange={(event) => setField("note", event.target.value)}
              rows={3}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm resize-none"
              placeholder="Shared note for other rescuers"
            />
            <button
              type="submit"
              disabled={submitting}
              className="lg:w-36 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Share
            </button>
          </div>
        </motion.form>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_150px_150px] gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm"
              placeholder="Search person, district, team, note"
            />
          </div>
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({ ...current, status: event.target.value }))
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All statuses</option>
            {EXCHANGE_STATUS.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                priority: event.target.value,
              }))
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All priorities</option>
            {EXCHANGE_PRIORITY.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-[260px] overflow-y-auto space-y-2 pr-1">
        {loading && (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}

        {!loading && filteredUpdates.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
            <Filter className="mx-auto mb-2 w-5 h-5 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">
              No shared updates match these filters.
            </p>
          </div>
        )}

        {filteredUpdates.map((item, index) => (
          <motion.article
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.015, 0.18) }}
            className="rounded-xl border border-slate-200 bg-white p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {item.personName}
                  </h3>
                  {item.caseRef && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                      {item.caseRef}
                    </span>
                  )}
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles[item.status] || statusStyles.unresolved}`}
                  >
                    {statusLabels[item.status] || item.status}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(item.createdAt)}
                  </span>
                  {item.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {item.location}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                  item.priority === "CRITICAL"
                    ? "bg-red-600 text-white"
                    : item.priority === "HIGH"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {item.priority}
              </span>
            </div>

            {item.note && (
              <p className="mt-2 text-sm leading-relaxed text-slate-700">
                {item.note}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              {item.district && <span>{item.district}</span>}
              {item.displacementZone && <span>{item.displacementZone}</span>}
              <span>{item.sourceType || "field"}</span>
              <span>
                Shared by {item.actor?.name || "rescue operator"}
                {item.teamName ? ` / ${item.teamName}` : ""}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              {item.actor?.uid === user?.uid ? (
                <span className="text-[11px] font-semibold text-slate-500">
                  Your shared request is waiting for another rescuer to add.
                </span>
              ) : item.missingPersonId || item.adoptedMissingPersonId ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Added to search board
                </span>
              ) : (
                <>
                  <span className="text-[11px] font-medium text-slate-500">
                    Add this shared request as a searchable missing-person case.
                  </span>
                  <button
                    onClick={() => handleAddToSearchBoard(item)}
                    disabled={addingId === item.id}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                  >
                    {addingId === item.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    Add to Search
                  </button>
                </>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
