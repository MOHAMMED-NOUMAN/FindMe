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
  registerWithEmailPassword,
  signInWithEmailPassword,
  signOutUser,
  onAuthChange,
} from "../firebase/authService";
import {
  getRescuerRequestByEmail,
  submitRescuerRequest,
} from "../firebase/rescuerRequests";

// ── Shared Google button ───────────────────────────────────────────────────
function GoogleButton({ onClick, disabled, label = "Continue with Google" }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#162D6B] text-white text-sm font-semibold transition-colors shadow-md shadow-[#1E3A8A]/20 disabled:opacity-60"
    >
      {disabled ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      )}
      {!disabled && label}
    </motion.button>
  );
}

// ── Login Gate ────────────────────────────────────────────────────────────
function LoginGate({
  onRegister,
  onGoogleAuth,
  onEmailAuth,
  loading,
  authLoading,
  error,
  registrationDone,
  registeredEmail,
}) {
  const [tab, setTab] = useState("register"); // "register" | "signin"

  // ── Registration form state
  const [regForm, setRegForm] = useState({
    name: "",
    orgType: "NGO",
    orgName: "",
    email: "",
    phone: "",
    idProofFile: null,
  });
  // Post-registration email/password step
  const [regPassword, setRegPassword] = useState("");

  // ── Sign-in form state (for existing rescuers)
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const setRegField = (key, value) =>
    setRegForm((c) => ({ ...c, [key]: value }));

  const handleRegistration = async (e) => {
    e.preventDefault();
    await onRegister(regForm);
  };

  // After registration: create account then sign in
  const handlePostRegEmail = async (e) => {
    e.preventDefault();
    if (!registeredEmail || !regPassword.trim()) return;
    await onEmailAuth({ email: registeredEmail, password: regPassword, isSignIn: false });
  };

  // Direct sign-in for existing rescuers
  const handleSignInEmail = async (e) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) return;
    await onEmailAuth({ email: signInEmail, password: signInPassword, isSignIn: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8FAFC] to-[#E0F2FE]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 md:p-8 max-w-xl w-full mx-4"
      >
        {/* Header */}
        <div className="w-14 h-14 bg-[#1E3A8A]/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-7 h-7 text-[#1E3A8A]" />
        </div>
        <h1
          className="text-2xl font-bold text-[#0F172A] mb-5 text-center"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Rescuer Access
        </h1>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 rounded-xl p-1 mb-5">
          <button
            onClick={() => setTab("register")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
              tab === "register"
                ? "bg-white text-[#1E3A8A] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Register
          </button>
          <button
            onClick={() => setTab("signin")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-all ${
              tab === "signin"
                ? "bg-white text-[#1E3A8A] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Sign In
          </button>
        </div>

        {/* ── REGISTER TAB ── */}
        {tab === "register" && (
          <>
            {!registrationDone ? (
              <>
                <p className="text-sm text-[#475569] mb-4 leading-relaxed text-center">
                  New to the platform? Fill in your details to register as rescue personnel.
                </p>
                <form onSubmit={handleRegistration} className="space-y-3">
                  <input
                    required
                    value={regForm.name}
                    onChange={(e) => setRegField("name", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Full Name"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={regForm.orgType}
                      onChange={(e) => setRegField("orgType", e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option>NGO</option>
                      <option>Police</option>
                      <option>NDRF</option>
                      <option>SDRF</option>
                    </select>
                    <input
                      required
                      value={regForm.orgName}
                      onChange={(e) => setRegField("orgName", e.target.value)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Organization Name"
                    />
                  </div>
                  <input
                    required
                    type="email"
                    value={regForm.email}
                    onChange={(e) => setRegField("email", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Official Email"
                  />
                  <input
                    required
                    value={regForm.phone}
                    onChange={(e) => setRegField("phone", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Phone Number"
                  />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setRegField("idProofFile", e.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#162D6B] disabled:opacity-60"
                  >
                    {loading ? "Submitting…" : "Submit Registration"}
                  </button>
                </form>
              </>
            ) : (
              /* Post-registration: authenticate */
              <div className="space-y-3">
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  ✅ Registration submitted for <strong>{registeredEmail}</strong>. Now create your
                  login to access the dashboard.
                </p>

                <GoogleButton onClick={onGoogleAuth} disabled={authLoading} />

                <div className="relative flex items-center gap-2 my-1">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <form onSubmit={handlePostRegEmail} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Create Email / Password Account
                  </p>
                  <input
                    value={registeredEmail}
                    readOnly
                    className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                  />
                  <input
                    required
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Create a password"
                  />
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    {authLoading ? "Creating account…" : "Create Account & Sign In"}
                  </button>
                </form>
              </div>
            )}
          </>
        )}

        {/* ── SIGN IN TAB ── */}
        {tab === "signin" && (
          <div className="space-y-3">
            <p className="text-sm text-[#475569] mb-1 leading-relaxed text-center">
              Already registered? Sign in to access your dashboard.
            </p>

            <GoogleButton onClick={onGoogleAuth} disabled={authLoading} label="Sign In with Google" />

            <div className="relative flex items-center gap-2 my-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[11px] text-slate-400 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <form onSubmit={handleSignInEmail} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Email / Password
              </p>
              <input
                required
                type="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Your registered email"
              />
              <input
                required
                type="password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="Password"
              />
              <button
                type="submit"
                disabled={authLoading}
                className="w-full rounded-lg bg-[#1E3A8A] px-3 py-2 text-sm font-semibold text-white hover:bg-[#162D6B] disabled:opacity-60"
              >
                {authLoading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-1">
              New here?{" "}
              <button
                onClick={() => setTab("register")}
                className="text-[#1E3A8A] font-semibold hover:underline"
              >
                Register first
              </button>
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </motion.div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function RescueDashboard() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [loginLoading, setLoginLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [registrationDone, setRegistrationDone] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [approvalState, setApprovalState] = useState("checking"); // checking | approved | pending | missing | rejected
  const [mobileView, setMobileView] = useState("board");
  const [leftTab, setLeftTab] = useState("board"); // "board" | "safe" | "exchange" | "comms" | "ai"

  // Track auth state
  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    return () => unsub();
  }, []);

  const handleRegister = async (payload) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const request = await submitRescuerRequest(payload);
      const email = request.email || payload.email?.trim().toLowerCase() || "";
      setRegisteredEmail(email);
      setRegistrationDone(true);
    } catch (err) {
      setLoginError(err?.message || "Registration failed. Please retry.");
    } finally {
      setLoginLoading(false);
    }
  };

  const verifySignedInRescuer = async (signedUser) => {
    if (!signedUser?.email) {
      setApprovalState("missing");
      return false;
    }

    const request = await getRescuerRequestByEmail(signedUser.email);
    if (!request) {
      setApprovalState("missing");
      return false;
    }

    setApprovalState("approved");
    return true;
  };

  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    setLoginError(null);
    try {
      const signedUser = await signInWithGoogle();
      const expected = registeredEmail.trim().toLowerCase();
      const actual = signedUser.email?.trim().toLowerCase();
      if (expected && actual !== expected) {
        await signOutUser();
        throw new Error("Authenticated email does not match registered email.");
      }
      const ok = await verifySignedInRescuer(signedUser);
      if (!ok) {
        await signOutUser();
        throw new Error("No registration found for this account. Please register first.");
      }
    } catch (err) {
      setLoginError(err?.message || "Google sign-in failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailAuth = async ({ email, password, isSignIn }) => {
    setAuthLoading(true);
    setLoginError(null);
    try {
      const authUser = isSignIn
        ? await signInWithEmailPassword(email, password)
        : await registerWithEmailPassword(email, password);
      const ok = await verifySignedInRescuer(authUser);
      if (!ok) {
        await signOutUser();
        throw new Error("No registration found for this account. Please register first.");
      }
    } catch (err) {
      setLoginError(err?.message || "Email/password authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.isAnonymous) {
      setApprovalState("checking");
      return;
    }

    verifySignedInRescuer(user).catch(() => {
      setApprovalState("missing");
    });
  }, [user]);

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
        <LoginGate
          onRegister={handleRegister}
          onGoogleAuth={handleGoogleAuth}
          onEmailAuth={handleEmailAuth}
          loading={loginLoading}
          authLoading={authLoading}
          error={loginError}
          registrationDone={registrationDone}
          registeredEmail={registeredEmail}
        />
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
