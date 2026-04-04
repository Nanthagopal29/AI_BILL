import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const Input = ({ label, labelRight, icon: Icon, type = "text", className = "", ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-2">
      {(label || labelRight) && (
        <div className="flex items-center justify-between">
          {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
          {labelRight && <div>{labelRight}</div>}
        </div>
      )}
      <div className="relative">
        {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />}
        <input
          type={inputType}
          className={`w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 ${
            Icon ? "pl-12" : "pl-4"
          } ${isPassword ? "pr-14" : "pr-4"} text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export const Button = ({ children, variant = "primary", className = "", ...props }) => {
  const baseStyles = "flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-70 shadow-sm";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};