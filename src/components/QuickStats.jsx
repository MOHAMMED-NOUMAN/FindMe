import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Users, UserCheck, Tent, Headphones, Radio } from "lucide-react";
import {
  subscribeGlobalStats,
  subscribeCampsCount,
  subscribeTeamsCount,
} from "../firebase/stats";

export default function QuickStats() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({
    missing: "—",
    found: "—",
    camps: "—",
    teams: "—",
  });
  const [lastUpdated, setLastUpdated] = useState("just_now");

  useEffect(() => {
    const unsubStats = subscribeGlobalStats((data) => {
      setCounts((prev) => ({
        ...prev,
        missing: data.missing?.toLocaleString() ?? "—",
        found: data.found?.toLocaleString() ?? "—",
      }));
    });
    const unsubCamps = subscribeCampsCount((n) =>
      setCounts((prev) => ({ ...prev, camps: n.toLocaleString() })),
    );
    const unsubTeams = subscribeTeamsCount((n) =>
      setCounts((prev) => ({ ...prev, teams: n.toLocaleString() })),
    );
    const timer = setInterval(() => {
      setLastUpdated("less_than_minute");
    }, 30000);
    return () => {
      unsubStats();
      unsubCamps();
      unsubTeams();
      clearInterval(timer);
    };
  }, []);

  const stats = [
    { id: "missing", labelKey: "quick_stats.missing", value: counts.missing, icon: Users, color: "text-[#FB7185]", bg: "bg-[#FB7185]/8" },
    { id: "found",   labelKey: "quick_stats.found",   value: counts.found,   icon: UserCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { id: "camps",   labelKey: "quick_stats.camps",   value: counts.camps,   icon: Tent, color: "text-[#2DD4BF]", bg: "bg-[#2DD4BF]/8" },
    { id: "teams",   labelKey: "quick_stats.teams",   value: counts.teams,   icon: Headphones, color: "text-[#1E3A8A]", bg: "bg-[#1E3A8A]/8" },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="px-5 max-w-6xl mx-auto -mt-6 relative z-20"
    >
      <div
        className="mb-2.5 px-1 flex items-center justify-between"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <p className="text-[11px] text-slate-600 font-semibold uppercase tracking-wide inline-flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-red-500" />
          {t("quick_stats.snapshot")}
        </p>
        <p className="text-[11px] text-slate-500">
          {t("quick_stats.updated", { time: t(`common.${lastUpdated}`) })}
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 overflow-hidden">
        {stats.map(({ id, labelKey, value, icon: Icon, color, bg }) => (
          <div key={id} className="flex items-center gap-4 px-6 py-5">
            <div className={`p-2.5 rounded-xl ${bg} shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div style={{ fontFamily: "var(--font-body)" }}>
              <p className="text-2xl font-bold text-[#0F172A] leading-none">{value}</p>
              <p className="text-xs text-[#475569] mt-1 font-medium">{t(labelKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
