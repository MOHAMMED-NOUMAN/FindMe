import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, CheckCircle2, Loader2 } from "lucide-react";
import TaskCard from "./TaskCard";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import { resolveMissingPersonAsFound } from "../../firebase/missingPersons";

export default function TaskBoard({ user }) {
  const [missingPersons, setMissingPersons] = useState([]);
  const [mobileColumn, setMobileColumn] = useState("missing");
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveError, setResolveError] = useState(null);
  const [resolveForm, setResolveForm] = useState({
    locationDescription: "",
    district: "",
    verifiedBy: "",
    contactPhone: "",
    notes: "",
  });

  useEffect(() => {
    // Fetch directly from missing_persons to show all missing people!
    const q = query(
      collection(db, "missing_persons"),
      where("status", "==", "missing"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMissingPersons(data);
    });
    return () => unsub();
  }, []);

  // Group into two columns: Missing (No Match) and High Confidence (Has Match)
  const columns = [
    { id: "missing", label: "Missing", color: "bg-red-500" },
    { id: "match", label: "Confirmed Match", color: "bg-amber-500" },
  ];

  const grouped = {
    missing: [],
    match: [],
  };

  missingPersons.forEach((mp) => {
    // Determine column based on composite_score or found_person_id
    const isMatch = mp.composite_score >= 0.4 || mp.found_person_id != null;
    const bucket = isMatch ? grouped.match : grouped.missing;

    // Synthesize a task object so TaskCard can render it without changes
    const synthesizedTask = {
      id: mp.id,
      name: mp.name || "Unknown",
      photoUrl: mp.photoUrl || null,
      description:
        mp.description || (mp.physicalTags ? mp.physicalTags.join(", ") : null),
      priority: "HIGH",
      location:
        mp.lastKnownLocation?.description ||
        mp.lastKnownLocation?.district ||
        "Location Unknown",
      district: mp.lastKnownLocation?.district || "",
      hoursAgo: mp.createdAt?.toMillis
        ? Math.floor((Date.now() - mp.createdAt.toMillis()) / 3600000)
        : 0,
      status: isMatch ? "match" : "missing",
    };

    if (isMatch) {
      synthesizedTask.priority = "CRITICAL";
    }

    bucket.push(synthesizedTask);
  });

  const openResolve = (task) => {
    setResolveError(null);
    setResolveTarget(task);
    setResolveForm({
      locationDescription: task.location || "",
      district: task.district || "",
      verifiedBy: user?.displayName || user?.email || "",
      contactPhone: "",
      notes: "",
    });
  };

  const closeResolve = () => {
    if (resolvingId) return;
    setResolveTarget(null);
    setResolveError(null);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveTarget) return;
    setResolveError(null);
    setResolvingId(resolveTarget.id);
    try {
      await resolveMissingPersonAsFound({
        missingPersonId: resolveTarget.id,
        locationDescription: resolveForm.locationDescription,
        district: resolveForm.district,
        verifiedBy: resolveForm.verifiedBy,
        contactPhone: resolveForm.contactPhone,
        notes: resolveForm.notes,
        resolverUid: user?.uid,
        resolverName: user?.displayName || user?.email,
      });
      setResolveTarget(null);
    } catch (err) {
      setResolveError(err?.message || "Failed to resolve case. Please retry.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div
      style={{ fontFamily: "var(--font-body)" }}
      className="h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-[0.14em]">
          Live Search Board
        </h2>
        <span className="text-[11px] text-slate-500 font-medium">
          {missingPersons.length} missing person
          {missingPersons.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="md:hidden grid grid-cols-2 gap-2 mb-3">
        {columns.map((col) => {
          const count = (grouped[col.id] || []).length;
          const active = mobileColumn === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setMobileColumn(col.id)}
              className={`rounded-lg border px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                active
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {col.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 overflow-x-auto md:overflow-visible pb-2 flex-1">
        {columns.map((col, ci) => {
          const colTasks = grouped[col.id] || [];
          const isVisibleOnMobile = mobileColumn === col.id;
          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.05 }}
              className={`flex-1 min-w-[260px] max-w-[380px] flex flex-col ${
                isVisibleOnMobile ? "" : "hidden md:flex"
              }`}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-700">
                  {col.label}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards container */}
              <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 p-2 space-y-2 overflow-y-auto">
                {colTasks.length === 0 && (
                  <div className="text-center py-10 text-[12px] text-slate-500 font-medium">
                    No people in this category
                  </div>
                )}
                {colTasks.map((task, i) => (
                  <div key={task.id}>
                    <TaskCard
                      task={task}
                      index={i}
                      onResolve={openResolve}
                      isResolving={resolvingId === task.id}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {resolveTarget && (
        <div className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-[1px] flex items-end md:items-center justify-center p-0 md:p-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full md:max-w-lg bg-white rounded-t-2xl md:rounded-2xl border border-slate-200 shadow-xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">
                  Resolve As Found
                </h3>
                <p className="text-xs text-slate-500">
                  {resolveTarget.name || "Unknown person"}
                </p>
              </div>
              <button
                onClick={closeResolve}
                disabled={!!resolvingId}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleResolveSubmit}
              className="px-4 py-4 space-y-3 max-h-[80vh] overflow-y-auto"
            >
              {resolveError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {resolveError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Found Location *
                </label>
                <input
                  required
                  value={resolveForm.locationDescription}
                  onChange={(e) =>
                    setResolveForm((s) => ({
                      ...s,
                      locationDescription: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="e.g. Relief camp gate, Mehdipatnam"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District
                </label>
                <input
                  value={resolveForm.district}
                  onChange={(e) =>
                    setResolveForm((s) => ({ ...s, district: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="District"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Verified By *
                  </label>
                  <input
                    required
                    value={resolveForm.verifiedBy}
                    onChange={(e) =>
                      setResolveForm((s) => ({
                        ...s,
                        verifiedBy: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Officer / Rescuer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    value={resolveForm.contactPhone}
                    onChange={(e) =>
                      setResolveForm((s) => ({
                        ...s,
                        contactPhone: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Notes
                </label>
                <textarea
                  value={resolveForm.notes}
                  onChange={(e) =>
                    setResolveForm((s) => ({ ...s, notes: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeResolve}
                  disabled={!!resolvingId}
                  className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!resolvingId}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {resolvingId ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                      Processing
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirm
                      Resolution
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
