import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, Mail, ShieldAlert, User2 } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_BASE_URL } from "../../utils/auth";
import { Input, Button } from "./forms";

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

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <ToastContainer position="top-right" theme="colored" hideProgressBar />

      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.08),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(79,70,229,0.08),_transparent_24%),linear-gradient(145deg,_#f8fafc_0%,_#f1f5f9_45%,_#e2e8f0_100%)]" />

        <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.section
            initial={{ opacity: 0, x: -22 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block"
          >
            <div className="max-w-lg">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-medium text-blue-700 shadow-sm backdrop-blur">
                <ShieldAlert size={16} />
                Email OTP recovery
              </div>
              <h1 className="font-serif text-5xl leading-[1.02] tracking-tight text-slate-900 lg:text-6xl">
                Confirm the OTP
                <span className="block text-blue-600">then reset access</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                We&apos;ll send a 6-digit OTP to the registered email address already configured in your Django mail
                settings.
              </p>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-xl"
          >
            <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur md:p-8">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600 transition hover:bg-white"
              >
                <ArrowLeft size={14} />
                Back
              </button>

              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Forgot password</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Step 1: request OTP. Step 2: enter OTP and choose a new password.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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

                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? "Sending OTP..." : "Send OTP to Email"}
                </Button>

                {otpSent && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    OTP sent. Check your inbox and spam folder. The code is valid for 5 minutes.
                  </div>
                )}

                <Input
                  label="OTP"
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  className="text-center text-lg font-semibold tracking-widest"
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
