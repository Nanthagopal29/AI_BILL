import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Import useNavigate
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Shield, Lock, User, ArrowRight, Radio } from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate(); // 2. Initialize navigate

  // Mouse Parallax Logic
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [5, -5]);
  const rotateY = useTransform(mouseX, [-300, 300], [-5, 5]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      // Your specific credentials
      if (username === "Admin" && (pin === "6383" || pin === "7305")) {
        toast.success("Identity Verified. Redirecting...");
        
        // 3. Navigate to home after a short delay for the toast
        setTimeout(() => {
          navigate("/home");
        }, 1200);
      } else {
        toast.error("Invalid Security Credentials");
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full flex items-center justify-center bg-[#050505] overflow-hidden font-sans text-slate-200 p-4"
    >
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

      <ToastContainer theme="dark" />

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative z-10 w-full max-w-[450px]"
      >
        <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-blue-500/20"
            >
              <Shield className="text-white" size={32} />
            </motion.div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Security Portal</h1>
            <p className="text-slate-500 text-sm mt-1">Authorized Personnel Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 ml-1">User Identifier</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500/40 transition-all outline-none text-white placeholder:text-slate-600"
                  placeholder="Username"
                  required
                />
              </div>
            </div>

            {/* PIN Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 ml-1">Access Passkey</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="password"
                  maxLength="4"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500/40 transition-all outline-none text-white tracking-[0.5em] placeholder:tracking-normal placeholder:text-slate-600"
                  placeholder="••••"
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <motion.button
              disabled={isLoading}
              whileHover={{ translateY: -2 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full py-4 mt-4 bg-white text-black rounded-2xl font-bold text-sm transition-all overflow-hidden group"
            >
              {isLoading ? (
                <div className="flex justify-center items-center gap-2">
                  <Radio className="animate-pulse text-blue-600" size={18} />
                  <span>AUTHENTICATING...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>ENTER SYSTEM</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </motion.button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-widest">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Secure Link Active
            </span>
            <span>Node: 77-Alpha</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;