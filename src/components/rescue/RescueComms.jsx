import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Filter,
  Loader2,
  MapPin,
  Radio,
  Search,
  Send,
  ShieldAlert,
} from "lucide-react";
import {
  acknowledgeCommsUpdate,
  COMMS_CATEGORIES,
  COMMS_PRIORITY,
  postCommsUpdate,
  resolveCommsUpdate,
  subscribeRescueComms,
} from "../../firebase/rescueComms";

const categoryLabels = {
  roadblock: "Roadblock",
  danger: "Danger",
  medical: "Medical",
  shelter: "Shelter",
  supply: "Supply",
  rescue_needed: "Rescue Needed",
  general: "General",
};

const categoryStyles = {
  roadblock: "bg-orange-50 text-orange-700 border-orange-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  medical: "bg-rose-50 text-rose-700 border-rose-200",
  shelter: "bg-blue-50 text-blue-700 border-blue-200",
  supply: "bg-amber-50 text-amber-700 border-amber-200",
  rescue_needed: "bg-purple-50 text-purple-700 border-purple-200",
  general: "bg-slate-100 text-slate-700 border-slate-200",
};

const emptyForm = {
  message: "",
  category: "general",
  priority: "HIGH",
  district: "",
  location: "",
  zone: "",
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

function compactTitle(message, category) {
  const text = message.trim();
  if (!text) return `${categoryLabels[category] || "Field"} update`;
  return text.length > 64 ? `${text.slice(0, 61)}...` : text;
}

export default function RescueComms({ user }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    priority: "all",
    status: "active",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    return subscribeRescueComms(
      (updates) => {
        setItems(updates);
        setLoading(false);
      },
      (err) => {
        setError(err?.message || "Could not load field comms.");
        setLoading(false);
      },
    );
  }, []);

  const stats = useMemo(
    () => ({
      active: items.filter((item) => item.status !== "resolved").length,
      critical: items.filter(
        (item) => item.status !== "resolved" && item.priority === "CRITICAL",
      ).length,
      acknowledged: items.filter((item) => item.acknowledgements?.length > 0)
        .length,
    }),
    [items],
  );

  const filteredItems = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return items
      .filter((item) => {
        const matchesSearch =
          !term ||
          [item.title, item.message, item.district, item.location, item.zone]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(term));
        const matchesCategory =
          filters.category === "all" || item.category === filters.category;
        const matchesPriority =
          filters.priority === "all" || item.priority === filters.priority;
        const matchesStatus =
          filters.status === "all" ||
          (filters.status === "active" && item.status !== "resolved") ||
          item.status === filters.status;

        return (
          matchesSearch && matchesCategory && matchesPriority && matchesStatus
        );
      })
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return aTime - bTime;
      });
  }, [filters, items]);

  const setField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const hasAcknowledged = (item) =>
    item.acknowledgements?.some((ack) => ack.uid === user?.uid);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.message.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      await postCommsUpdate(
        {
          ...form,
          title: compactTitle(form.message, form.category),
        },
        user,
      );
      setForm(emptyForm);
    } catch (err) {
      setError(err?.message || "Could not send this message.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (item) => {
    setBusyId(item.id);
    setError(null);
    try {
      await acknowledgeCommsUpdate(item, user);
    } catch (err) {
      setError(err?.message || "Could not acknowledge this update.");
    } finally {
      setBusyId(null);
    }
  };

  const handleResolve = async (item) => {
    setBusyId(item.id);
    setError(null);
    try {
      await resolveCommsUpdate(item, user);
    } catch (err) {
      setError(err?.message || "Could not resolve this update.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="h-full min-h-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-700">
              <Radio className="w-3.5 h-3.5" />
              Rescue chat room
            </div>
            <h2 className="mt-2 text-base font-bold tracking-wide text-slate-900">
              Field Information Exchange
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                Active
              </p>
              <p className="text-lg font-bold text-slate-900">{stats.active}</p>
            </div>
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-red-600">
                Critical
              </p>
              <p className="text-lg font-bold text-red-700">{stats.critical}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-[10px] font-bold uppercase text-slate-500">
                Acked
              </p>
              <p className="text-lg font-bold text-slate-900">
                {stats.acknowledged}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() =>
              setFilters((current) => ({ ...current, category: "all" }))
            }
            className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${
              filters.category === "all"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            All
          </button>
          {COMMS_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() =>
                setFilters((current) => ({ ...current, category }))
              }
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${
                filters.category === category
                  ? "border-slate-900 bg-slate-900 text-white"
                  : categoryStyles[category]
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1fr_130px_120px] gap-2">
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
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm"
              placeholder="Search messages, roads, camps, districts"
            />
          </div>
          <select
            value={filters.priority}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                priority: event.target.value,
              }))
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">All priority</option>
            {COMMS_PRIORITY.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value,
              }))
            }
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mx-3 mt-3 shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 px-3 py-4">
        {loading && (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}

        {!loading && filteredItems.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center">
            <Filter className="mx-auto mb-2 w-5 h-5 text-slate-400" />
            <p className="text-sm font-semibold text-slate-600">
              No messages in this room yet.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {filteredItems.map((item, index) => {
            const mine = item.postedBy?.uid === user?.uid;
            const acked = hasAcknowledged(item);
            const resolved = item.status === "resolved";
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.01, 0.12) }}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[86%] rounded-2xl border px-3 py-2 shadow-sm ${
                    mine
                      ? "rounded-br-md border-blue-200 bg-blue-50"
                      : item.priority === "CRITICAL"
                        ? "rounded-bl-md border-red-200 bg-red-50"
                        : "rounded-bl-md border-slate-200 bg-white"
                  } ${resolved ? "opacity-70" : ""}`}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-700">
                      {mine ? "You" : item.postedBy?.name || "Rescuer"}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${categoryStyles[item.category] || categoryStyles.general}`}
                    >
                      {categoryLabels[item.category] || item.category}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        item.priority === "CRITICAL"
                          ? "bg-red-600 text-white"
                          : item.priority === "HIGH"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.priority}
                    </span>
                    {resolved && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                        Resolved
                      </span>
                    )}
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {item.message || item.title}
                  </p>

                  {(item.district || item.zone || item.location) && (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium text-slate-500">
                      {item.district && <span>{item.district}</span>}
                      {item.zone && <span>{item.zone}</span>}
                      {item.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.location}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatTime(item.createdAt)}
                      <span>
                        {item.acknowledgements?.length || 0} ack
                      </span>
                    </span>
                    {!resolved && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleAcknowledge(item)}
                          disabled={acked || busyId === item.id}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase text-slate-600 disabled:opacity-60"
                        >
                          {busyId === item.id && !acked ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ShieldAlert className="w-3 h-3" />
                          )}
                          {acked ? "Acked" : "Ack"}
                        </button>
                        <button
                          onClick={() => handleResolve(item)}
                          disabled={busyId === item.id}
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700 disabled:opacity-60"
                        >
                          {busyId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-slate-200 bg-white p-3"
      >
        <div className="mb-2 grid grid-cols-2 gap-2 lg:grid-cols-[140px_120px_1fr_1fr_1fr]">
          <select
            value={form.category}
            onChange={(event) => setField("category", event.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-xs font-semibold"
          >
            {COMMS_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>
          <select
            value={form.priority}
            onChange={(event) => setField("priority", event.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-2 text-xs font-semibold"
          >
            {COMMS_PRIORITY.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
          <input
            value={form.district}
            onChange={(event) => setField("district", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
            placeholder="District"
          />
          <input
            value={form.zone}
            onChange={(event) => setField("zone", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
            placeholder="Zone / camp"
          />
          <input
            value={form.location}
            onChange={(event) => setField("location", event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
            placeholder="Landmark / route"
          />
        </div>
        <div className="flex items-end gap-2">
          <textarea
            required
            value={form.message}
            onChange={(event) => setField("message", event.target.value)}
            rows={2}
            className="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            placeholder="Send field intel: road closed, camp full, water rising, medical help needed..."
          />
          <button
            type="submit"
            disabled={submitting || !form.message.trim()}
            className="h-12 w-12 shrink-0 inline-flex items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
            title="Send message"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
