import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Lock, Mail, User, Building2, AlertCircle, ShieldCheck } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { useEffect } from "react";

function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: loginContext } = useAuth();

  
  const [step, setStep] = useState(() =>
    location.state?.step === "otp" && location.state?.email ? "otp" : "form"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => location.state?.email || "");
  const [password, setPassword] = useState("");

  const [role, setRole] = useState("developer");
  const [orgName, setOrgName] = useState("");

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(() => location.state?.infoMessage || "");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    const registrationPayload = {
      name,
      email,
      password,
      role,
      ...(role === "org_admin" && { orgName }),
    };

    try {
      const res = await api.post("/auth/signup", registrationPayload);
      setSuccess(res.data.message || "Verification code sent to your email.");
      setStep("otp");
      setResendCooldown(30);
    } catch (err) {
      setError(err.response?.data?.message || "Registration refused. Check structural formatting bounds.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/verify-otp", { email, otp });
      loginContext(res.data.user, res.data.token);
      setSuccess("Email verified! Redirecting...");
      setTimeout(() => navigate("/problems"), 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired verification code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await api.post("/auth/resend-otp", { email });
      setSuccess(res.data.message || "A new code has been sent.");
      setResendCooldown(30);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center">
            <img src="/logo.png" alt="JudgeX Logo" className="h-10 w-10 object-contain" />
          </div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-100">
            {step === "form" ? "Create System Profile" : "Verify Your Email"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {step === "form"
              ? "Join the JudgeX decoupled code compilation ecosystem"
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{success}</span>
          </div>
        )}

        {step === "form" && (
          <form className="mt-8 space-y-6" onSubmit={handleSignupSubmit}>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspace Intent</label>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setRole("developer")}
                  className={`rounded-lg py-2 text-xs font-semibold transition-all duration-200 ${
                    role === "developer" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Developer / Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole("org_admin")}
                  className={`rounded-lg py-2 text-xs font-semibold transition-all duration-200 ${
                    role === "org_admin" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Enterprise Admin
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full User Name</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Ankit Gupta"
                  />
                </div>
              </div>

              {role === "org_admin" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organization Entity Name</label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Global Tech University"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Corporate Email Address</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="name@workspace.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Create Access Password</label>
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition-all duration-200"
            >
              {isLoading ? "Provisioning Framework Entities..." : "Register Security Account"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form className="mt-8 space-y-6" onSubmit={handleOtpSubmit}>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">6-Digit Verification Code</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 tracking-[0.5em] text-center font-mono text-lg focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                  placeholder="000000"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="group relative flex w-full justify-center rounded-xl bg-indigo-600 py-3 px-4 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition-all duration-200"
            >
              {isLoading ? "Verifying..." : "Verify & Continue"}
            </button>

            <div className="text-center text-sm text-slate-400">
              Didn't receive a code?{" "}
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || isLoading}
                className="font-medium text-indigo-400 hover:text-indigo-300 disabled:text-slate-600 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setStep("form");
                setOtp("");
                setError("");
                setSuccess("");
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-300"
            >
              ← Back to edit details
            </button>
          </form>
        )}

        {step === "form" && (
          <p className="text-center text-sm text-slate-400">
            Already have an active workspace?{" "}
            <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300">
              Log in to session
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default Signup;