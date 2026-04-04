import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, KeyRound, ShieldCheck, Sparkles, User2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../../utils/auth";
import { Input, Button } from "./forms";

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (location.state?.registeredUsername) {
      setUsername(location.state.registeredUsername);
      toast.success("Account created. Sign in to continue.");
    }

    if (location.state?.passwordReset) {
      toast.success("Password updated. Please sign in.");
    }
  }, [location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user || {}));
      toast.success("Welcome back");
      setTimeout(() => navigate("/home"), 700);
    } catch (error) {
      toast.error(error.message || "Invalid credentials. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <ToastContainer position="top-right" theme="colored" hideProgressBar />
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(79,70,229,0.08),_transparent_30%),linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)]" />
        <div className="absolute -left-16 top-20 h-56 w-56 rounded-full border border-blue-200/30 bg-blue-100/30 blur-3xl" />
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-indigo-100/30 blur-3xl" />

        <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.section initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur">
                <Sparkles size={16} />
                Modern billing access
              </div>
              <h1 className="font-serif text-6xl leading-[1.02] tracking-tight text-slate-900">
                Sign in to the
                <span className="block text-blue-600">Anand InfoTech desk</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
                Handle invoices, customer billing, and daily operations from one focused workspace designed for speed.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                  <div className="mb-3 inline-flex rounded-2xl bg-blue-50 p-3 text-blue-600">
                    <ShieldCheck size={20} />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">Protected sessions</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    JWT-backed authentication keeps billing actions restricted to signed-in users.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/80 bg-[#0f172a] p-5 text-slate-50 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
                  <div className="mb-3 inline-flex rounded-2xl bg-indigo-500/20 p-3 text-indigo-300">
                    <KeyRound size={20} />
                  </div>
                  <h2 className="text-base font-semibold">Simple recovery</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Forgot password is built in, so users can recover access without leaving the app.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-xl">
            <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                    <ShieldCheck size={14} />
                    Secure Login
                  </div>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Enter your account credentials to open the dashboard.
                  </p>
                </div>
                <div className="hidden rounded-3xl bg-blue-50 px-4 py-3 text-right text-xs font-medium text-blue-700 sm:block">
                  Billing
                  <span className="block text-lg font-semibold text-slate-900">Portal</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <Input
                  label="Username"
                  icon={User2}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />

                <Input
                  label="Password"
                  type="password"
                  icon={KeyRound}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  labelRight={
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
                    >
                      Forgot password?
                    </button>
                  }
                />

                <Button disabled={isLoading}>
                  {isLoading ? "Signing in..." : <>Continue to Dashboard<ArrowRight size={18} /></>}
                </Button>
              </form>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-slate-600">
                <ShieldCheck size={16} className="text-blue-600" />
                Signed-in sessions are required for bill creation, updates, and viewing records.
              </div>

              <div className="mt-6 text-center text-sm text-slate-500">
                New to the system?{" "}
                <button type="button" onClick={() => navigate("/register")} className="font-semibold text-blue-600 transition hover:text-blue-700">
                  Create an account
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Login;
