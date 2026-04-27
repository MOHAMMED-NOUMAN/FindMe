import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LogOut, ShieldCheck, Loader2, Radio, Sparkles, LayoutList, Share2, MessageSquareWarning } from "lucide-react";
import CommandMap from "../components/rescue/CommandMap";
import TaskBoard from "../components/rescue/TaskBoard";
import RescueExchange from "../components/rescue/RescueExchange";
import RescueComms from "../components/rescue/RescueComms";
import SafeReports from "../components/rescue/SafeReports";
import AIMatchResults from "../components/AIMatchResults";
import {
  signInWithGoogle,
  signOutUser,
  onAuthChange,
} from "../firebase/authService";

// ── Login Gate ────────────────────────────────────────────────────────────
function LoginGate({ onLogin, loading }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#E0F2FE]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 max-w-sm w-full mx-4 text-center"
      >
        <div className="w-14 h-14 bg-[#1E3A8A]/8 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <ShieldCheck className="w-7 h-7 text-[#1E3A8A]" />
        </div>
        <h1
          className="text-2xl font-bold text-[#0F172A] mb-2"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Rescue Access
        </h1>
        <p className="text-sm text-[#475569] mb-8 leading-relaxed">
          This dashboard is restricted to authorised rescue team members. Sign
          in with your Google account to continue.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#162D6B] text-white text-sm font-semibold transition-colors shadow-md shadow-[#1E3A8A]/20 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#fff"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#fff"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#fff"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#fff"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          )}
          {loading ? "Signing in…" : "Sign in with Google"}
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function RescueDashboard() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [mobileView, setMobileView] = useState("board");
  const [leftTab, setLeftTab] = useState("board"); // "board" | "safe" | "exchange" | "comms" | "ai"

  // Track auth state
  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setLoginError("Sign-in failed. Please try again.");
      console.error(err);
    } finally {
      setLoginLoading(false);
    }
  };

  // Still resolving auth state
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#1E3A8A] animate-spin" />
      </div>
    );
  }

  // Not logged in or anonymous user → show login gate
  if (!user || user.isAnonymous) {
    return (
      <>
        <LoginGate onLogin={handleLogin} loading={loginLoading} />
        {loginError && (
          <p className="text-center text-sm text-red-500 mt-2">{loginError}</p>
        )}
      </>
    );
  }

  return (
    <div
      className="emergency-mode h-screen flex flex-col bg-[#F2F4F7]"
      style={{
        "--font-body": '"IBM Plex Sans", sans-serif',
        "--font-heading": '"Rajdhani", sans-serif',
      }}
    >
      <div className="shrink-0 h-[96px]" />

      <div className="md:hidden px-4 py-2 border-b border-slate-300 bg-white">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMobileView("board")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
              mobileView === "board"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Search Board
          </button>
          <button
            onClick={() => setMobileView("map")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
              mobileView === "map"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Command Map
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ── LEFT PANEL ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className={`w-full md:w-1/2 shrink-0 border-b md:border-b-0 md:border-r border-slate-300 bg-white flex flex-col h-[calc(100vh-144px)] md:h-auto overflow-hidden ${
            mobileView === "board" ? "" : "hidden md:flex"
          }`}
        >
          {/* Operator bar */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 mb-3">
              <div className="flex items-center gap-2">
                <img
                  src={
                    user.photoURL ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || "R")}&background=1E3A8A&color=fff`
                  }
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full"
                />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">Operator</p>
                  <p className="text-xs font-semibold text-slate-700 truncate">
                    {user.displayName || user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={signOutUser}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </button>
            </div>

            {/* Left-panel tab switcher */}
            <div className="grid grid-cols-5 gap-1.5 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setLeftTab("board")}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                  leftTab === "board"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                Search Board
              </button>
              <button
                onClick={() => setLeftTab("safe")}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                  leftTab === "safe"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Safe
              </button>
              <button
                onClick={() => setLeftTab("exchange")}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                  leftTab === "exchange"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                Exchange
              </button>
              <button
                onClick={() => setLeftTab("comms")}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                  leftTab === "comms"
                    ? "bg-white text-red-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <MessageSquareWarning className="w-3.5 h-3.5" />
                Comms
              </button>
              <button
                onClick={() => setLeftTab("ai")}
                className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
                  leftTab === "ai"
                    ? "bg-white text-[#1E3A8A] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI
              </button>
            </div>
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {leftTab === "board" ? (
              <>
                <div className="flex items-center justify-between px-1">
                  <h2 className="emergency-heading text-lg tracking-wide text-slate-900">
                    Emergency Search Board
                  </h2>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600 uppercase tracking-wide">
                    <Radio className="w-3.5 h-3.5" /> Live
                  </span>
                </div>
                <TaskBoard user={user} />
              </>
            ) : leftTab === "exchange" ? (
              <RescueExchange user={user} />
            ) : leftTab === "safe" ? (
              <SafeReports user={user} />
            ) : leftTab === "comms" ? (
              <RescueComms user={user} />
            ) : (
              <AIMatchResults />
            )}
          </div>
        </motion.div>

        {/* ── RIGHT PANEL: COMMAND MAP ─────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className={`w-full md:w-1/2 flex flex-col h-[calc(100vh-144px)] md:h-auto min-h-0 overflow-hidden ${
            mobileView === "map" ? "" : "hidden md:flex"
          }`}
        >
          <CommandMap />
        </motion.div>
      </div>
    </div>
  );
}
