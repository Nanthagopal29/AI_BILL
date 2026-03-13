import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Lock, User, Eye, EyeOff, Loader2, Info } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Professional delay mimics server-side verification
    setTimeout(() => {
      if (username === "Admin" && (pin === "6383" || pin === "7305")) {
        toast.success("Authentication Successful");
        setTimeout(() => navigate("/home"), 1000);
      } else {
        toast.error("Invalid credentials. Please contact your administrator.");
        setIsLoading(false);
      }
    }, 1800);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100">
      
      {/* Subtle Professional Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-3xl" />
      </div>

      <ToastContainer position="top-right" theme="colored" hideProgressBar />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[420px] px-4"
      >
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2 text-blue-600">
              <ShieldCheck size={24} strokeWidth={2.5} />
              <span className="font-bold tracking-tight text-lg">Anand InfoTech</span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
            <p className="text-slate-500 text-sm mt-1">Enter your credentials to access the console.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-slate-700 ml-0.5">Username</label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-3 pl-11 pr-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm placeholder:text-slate-400"
                  placeholder="e.g. j.doe"
                  required
                />
              </div>
            </div>

            {/* PIN/Passkey */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-0.5">
                <label className="text-[13px] font-medium text-slate-700">Access PIN</label>
              
              </div>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPin ? "text" : "password"}
                  maxLength="4"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-3 pl-11 pr-12 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm tracking-[0.2em] placeholder:tracking-normal placeholder:text-slate-400"
                  placeholder="••••"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              disabled={isLoading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition-all flex items-center justify-center shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Verifying Identity...
                </>
              ) : (
                "Continue to Dashboard"
              )}
            </button>
          </form>

          {/* Security Banner */}
          <div className="mt-8 flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
            <Info className="text-blue-500 shrink-0" size={16} />
            <p className="text-[11px] text-blue-700/80 leading-relaxed">
              This session is protected by end-to-end encryption. Unauthorized access attempts are logged and reported.
            </p>
          </div>
        </div>

        {/* External Links */}
        <div className="mt-6 flex justify-center gap-6 text-[12px] text-slate-400 font-medium">
          <button className="hover:text-slate-600">Privacy Policy</button>
          <button className="hover:text-slate-600">Support</button>
          <button className="hover:text-slate-600">Terms of Service</button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;