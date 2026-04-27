import { motion } from "framer-motion";
import { MapPin, Clock, User, CheckCircle2 } from "lucide-react";

const priorityConfig = {
  CRITICAL: {
    bg: "bg-red-500/10",
    text: "text-red-600",
    border: "border-red-500/30",
    badge: "bg-red-500 text-white",
    dot: "bg-red-500",
  },
  HIGH: {
    bg: "bg-orange-500/10",
    text: "text-orange-600",
    border: "border-orange-400/30",
    badge: "bg-orange-500 text-white",
    dot: "bg-orange-400",
  },
  MEDIUM: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-700",
    border: "border-yellow-400/30",
    badge: "bg-yellow-400 text-yellow-900",
    dot: "bg-yellow-400",
  },
};

export default function TaskCard({
  task,
  index = 0,
  onResolve,
  isResolving = false,
}) {
  const cfg = priorityConfig[task.priority] || priorityConfig.MEDIUM;
  const isOverdue = (task.hoursAgo || 0) > 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02, duration: 0.18 }}
      className={`
        rounded-xl border p-3 transition-colors
        ${isOverdue ? "border-red-300 bg-red-50/40" : "border-slate-200 bg-white"}
      `}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div className="flex gap-3 mb-2.5">
        {task.photoUrl ? (
          <img
            src={task.photoUrl}
            alt={task.name}
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
          />
        ) : (
          <div className="w-10 h-10 rounded-full shrink-0 bg-slate-100 flex items-center justify-center border border-slate-200">
            <User className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <h4 className="text-[14px] font-bold text-slate-800 leading-tight truncate">
              {task.name}
            </h4>
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider ${cfg.badge}`}
            >
              {task.priority}
            </span>
          </div>
          {task.description && (
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[12px] text-slate-600 mb-2">
        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
        <span className="truncate font-medium">{task.location}</span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 ${cfg.bg} ${cfg.text} border ${cfg.border} font-semibold`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {task.status === "match" ? "Potential match" : "Missing"}
        </span>
        <span
          className={`flex items-center gap-1 font-medium ${isOverdue ? "text-red-600 font-semibold" : ""}`}
        >
          <Clock className="w-3.5 h-3.5 opacity-70" />
          {task.hoursAgo || 0}h ago
        </span>
      </div>

      <button
        onClick={() => onResolve?.(task)}
        disabled={isResolving}
        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-60"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        {isResolving ? "Resolving..." : "Resolve as Found"}
      </button>
    </motion.div>
  );
}
