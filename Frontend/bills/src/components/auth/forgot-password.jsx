import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock3, KeyRound, Mail, ShieldAlert, User2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../../utils/auth";
import { Input, Button } from "./forms";

const OTP_EXPIRY_SECONDS = 300;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!secondsLeft) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const handleSendOtp = async () => {
    if (!form.username || !form.email) {
      toast.error("Enter username and registered email first.");
      return;
    }

    setSendingOtp(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/request-otp/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to send OTP");
      }

      setOtpSent(true);
      setSecondsLeft(OTP_EXPIRY_SECONDS);
      toast.success(data.message || "OTP sent to your email");
    } catch (error) {
      toast.error(error.message || "Unable to send OTP.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otpSent) {
      toast.error("Send OTP first.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setResettingPassword(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password/reset/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          otp: form.otp,
          new_password: form.newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to reset password");
      }

      toast.success("Password reset complete");
      setTimeout(() => {
        navigate("/", {
          state: {
            registeredUsername: form.username,
            passwordReset: true,
          },
        });
      }, 800);
    } catch (error) {
      toast.error(error.message || "Unable to reset password.");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#eff4ff] text-slate-900">
      <ToastContainer position="top-right" theme="colored" hideProgressBar />

      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(79,70,229,0.12),_transparent_26%),linear-gradient(145deg,_#eff4ff_0%,_#f8fbff_45%,_#e7eefc_100%)]" />
        <div className="absolute left-0 top-12 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />

        <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[0.92fr_1.08fr]">
          <motion.section
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block"
          >
            <div className="max-w-lg">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur">
                <ShieldAlert size={16} />
                Email OTP recovery
              </div>

              <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-slate-900 lg:text-6xl">
                Securely recover
                <span className="block text-blue-600">your billing account</span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-600">
                Request a one-time password by email, verify the code, then create a new password in one guided flow.
              </p>

              <div className="mt-10 grid gap-4">
                <div className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                      <Mail size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Step 1: Send OTP</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        We send a 6-digit code to the registered email address linked to the username.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                      <KeyRound size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">Step 2: Verify and reset</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Enter the OTP, set a new password, and return to login with your updated credentials.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-xl"
          >
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition hover:bg-white"
              >
                <ArrowLeft size={14} />
                Back to Login
              </button>

              <div className="mb-8 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Forgot password</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Request OTP first, then verify the code to reset the password.
                  </p>
                </div>
                <div className="hidden rounded-3xl bg-blue-50 px-4 py-3 text-right text-xs font-medium text-blue-700 sm:block">
                  OTP
                  <span className="block text-lg font-semibold text-slate-900">Recovery</span>
                </div>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className={`rounded-2xl border px-4 py-3 text-sm ${otpSent ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-blue-200 bg-blue-50 text-blue-700"}`}>
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 size={16} />
                    Step 1
                  </div>
                  <p className="mt-1 text-xs">Send OTP to registered email</p>
                </div>

                <div className={`rounded-2xl border px-4 py-3 text-sm ${otpSent ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  <div className="flex items-center gap-2 font-semibold">
                    <KeyRound size={16} />
                    Step 2
                  </div>
                  <p className="mt-1 text-xs">Verify code and set new password</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Username"
                  icon={User2}
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Enter username"
                  required
                />

                <Input
                  type="email"
                  label="Email"
                  icon={Mail}
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter registered email"
                  required
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">Request OTP by email</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        The OTP stays valid for 5 minutes after sending.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {secondsLeft > 0 && (
                        <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-blue-700 shadow-sm">
                          <Clock3 size={14} />
                          {formatTime(secondsLeft)}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp}
                        className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {sendingOtp ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                      </button>
                    </div>
                  </div>
                </div>

                {otpSent && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    OTP sent successfully. Check your inbox and spam folder, then continue with the reset below.
                  </div>
                )}

                <Input
                  label="OTP"
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  className="text-center text-lg font-semibold tracking-[0.4em]"
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  required
                />

                <div className="grid gap-5 md:grid-cols-2">
                  <Input
                    type="password"
                    label="New password"
                    icon={KeyRound}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="New password"
                    required
                  />

                  <Input
                    type="password"
                    label="Confirm password"
                    icon={KeyRound}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    required
                  />
                </div>

                <Button disabled={resettingPassword}>
                  {resettingPassword ? "Updating password..." : "Verify OTP and Reset Password"}
                </Button>
              </form>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
