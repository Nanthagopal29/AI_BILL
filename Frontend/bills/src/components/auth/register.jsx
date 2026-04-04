import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { ArrowLeft, BadgeCheck, Mail, User2, UserPlus } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../../utils/auth";
import { Input, Button } from "./forms";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/users/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          role: form.role,
          is_active: 1,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      toast.success("Account created successfully");
      setTimeout(() => {
        navigate("/", {
          state: {
            registeredUsername: form.username,
          },
        });
      }, 800);
    } catch (error) {
      toast.error(error.message || "Unable to create account.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <ToastContainer position="top-right" theme="colored" hideProgressBar />
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.08),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(79,70,229,0.08),_transparent_28%),linear-gradient(145deg,_#f8fafc_0%,_#f1f5f9_55%,_#e2e8f0_100%)]" />

        <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.section initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block">
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur">
                <BadgeCheck size={16} />
                New user onboarding
              </div>
              <h1 className="font-serif text-6xl leading-[1.02] tracking-tight text-slate-900">
                Create access for your
                <span className="block text-blue-600">billing workspace</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
                Set up a new account in a few seconds and move straight into invoice management with secure login.
              </p>

              <div className="mt-10 rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                <h2 className="text-base font-semibold text-slate-900">What you get</h2>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Immediate sign-in after registration
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    Protected bill creation and updates
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-700" />
                    Password recovery built into the same flow
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-xl">
            <div className="rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
              <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition hover:bg-white"
                  >
                    <ArrowLeft size={14} />
                    Back
                  </button>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Create account</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Register a user profile to start working inside the billing panel.
                  </p>
                </div>
                <div className="hidden rounded-3xl bg-blue-50 px-4 py-3 text-right text-xs font-medium text-blue-700 sm:block">
                  Setup
                  <span className="block text-lg font-semibold text-slate-900">Account</span>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Username</label>
                  <div className="relative">
                    <User2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      placeholder="Enter your recovery email"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-4 pr-12 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        placeholder="Create password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Confirm password</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-4 pr-12 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        placeholder="Repeat password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  disabled={isLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 shadow-sm"
                >
                  {isLoading ? "Creating account..." : <><UserPlus size={18} />Register account</>}
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 px-4 py-3 text-sm text-slate-600">
                Your email is also used to verify forgot-password requests.
              </div>

              <div className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <button type="button" onClick={() => navigate("/")} className="font-semibold text-blue-600 transition hover:text-blue-700">
                  Sign in instead
                </button>
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default Register;
