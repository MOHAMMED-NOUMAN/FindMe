import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Search,
  UserPlus,
  ShieldCheck,
  Clock3,
  Phone,
  ArrowRight,
  Building2,
} from "lucide-react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Hero() {
  const { t } = useTranslation();
  return (
    <section
      id="home"
      className="relative flex min-h-[82vh] items-center justify-center px-5 py-24"
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-4xl text-center space-y-6"
      >
        {/* Label */}
        <motion.div variants={fadeUp} className="flex justify-center">
          <span
            className="inline-block rounded-full bg-[#1E3A8A]/5 border border-[#1E3A8A]/10 px-4 py-1.5 text-xs text-[#1E3A8A] tracking-widest uppercase"
            style={{ fontFamily: "var(--font-accent)" }}
          >
            {t("hero.platform_label")}
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <span className="text-[#0F172A]">Find </span>
          <span className="bg-gradient-to-r from-[#1E3A8A] to-[#2DD4BF] bg-clip-text text-transparent">
            Me
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          variants={fadeUp}
          className="text-xl sm:text-2xl font-medium text-[#475569] max-w-2xl mx-auto"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t("hero.tagline")}
        </motion.p>

        {/* Subtext */}
        <motion.p
          variants={fadeUp}
          className="text-base sm:text-lg text-[#475569]/80 max-w-xl mx-auto"
          style={{ fontFamily: "var(--font-body)" }}
        >
          {t("hero.subtitle")}
        </motion.p>

        {/* 3 CTA Buttons */}
        <motion.div
          variants={fadeUp}
          className="pt-4 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3"
        >
          {/* Search for Someone */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-2 border border-[#1E3A8A]/35 bg-white/90 hover:bg-[#1E3A8A]/5 text-[#1E3A8A] rounded-xl px-6 py-3.5 font-semibold text-sm transition-colors"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <Search className="w-4 h-4" />
              {t("hero.search_btn")}
            </Link>
          </motion.div>

          {/* Report Missing */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/report"
              className="inline-flex items-center justify-center gap-2 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl px-6 py-3.5 font-bold text-sm transition-colors shadow-md shadow-[#E11D48]/25"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <UserPlus className="w-4 h-4" />
              {t("hero.report_btn")}
            </Link>
          </motion.div>

          {/* Report Found */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/report-found"
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-3.5 font-semibold text-sm transition-colors shadow-md shadow-emerald-600/20"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <UserPlus className="w-4 h-4" />
              {t("hero.report_found_btn")}
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="mx-auto mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-3xl"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 font-semibold inline-flex items-center justify-center gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            {t("hero.emergency_label")}
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 font-semibold inline-flex items-center justify-center gap-1.5">
            <Clock3 className="w-3.5 h-3.5" />
            {t("hero.live_data_label")}
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 font-semibold inline-flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t("hero.verified_label")}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="mx-auto mt-3 max-w-3xl">
          <Link
            to="/rescue"
            className="group w-full rounded-2xl border border-[#1E3A8A]/20 bg-white/90 backdrop-blur-sm px-4 py-3.5 sm:px-5 sm:py-4 inline-flex items-center justify-between gap-3 hover:border-[#1E3A8A]/45 hover:bg-[#1E3A8A]/5 transition-colors"
            style={{ fontFamily: "var(--font-body)" }}
          >
            <span className="inline-flex items-center gap-2.5 text-left">
              <span className="h-9 w-9 rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A] inline-flex items-center justify-center shrink-0">
                <Building2 className="w-4.5 h-4.5" />
              </span>
              <span>
                <span className="block text-[11px] sm:text-xs font-bold tracking-[0.12em] uppercase text-[#1E3A8A]">
                  {t("hero.rescue_teams_label")}
                </span>
                <span className="block text-sm sm:text-[15px] font-semibold text-[#0F172A]">
                  {t("hero.rescue_cta")}
                </span>
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-[#1E3A8A] shrink-0">
              {t("hero.enter")}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
