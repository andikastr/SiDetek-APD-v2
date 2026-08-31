"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HardHat,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Shield,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: identifier.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Invalid username or password.");
        setIsLoading(false);
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch {
      setErrorMsg("Network connection error. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] relative z-10">
      {/* Back Button & Top Safety Badge Bar */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white/80 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-xs backdrop-blur-md transition-all group cursor-pointer"
          title="Back to Overview"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-slate-500 dark:text-slate-400 group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6]" />
          <span>Back</span>
        </Link>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-500/10 border border-blue-200/80 dark:border-blue-500/20 text-[11px] font-semibold text-[#2563EB] dark:text-[#60A5FA] shadow-xs backdrop-blur-md">
          <Shield className="w-3.5 h-3.5" />
          <span>Safety Access</span>
        </div>
      </div>

      {/* Main Glassmorphism Card */}
      <div className="relative rounded-2xl bg-white/90 dark:bg-[#0D1524]/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl p-7 sm:p-8 transition-all duration-200">
        {/* Subtle Top Border Glow Gradient */}
        <div className="absolute inset-x-6 -top-px h-px bg-gradient-to-r from-transparent via-[#2563EB] dark:via-[#3B82F6] to-transparent opacity-70" />

        {/* Brand Header */}
        <div className="text-center mb-6 space-y-1.5">
          <div className="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] dark:from-[#3B82F6] dark:to-[#1E40AF] text-white shadow-lg shadow-blue-500/25 mb-1.5 transform hover:scale-105 transition-transform duration-200">
            <HardHat className="w-6 h-6 text-white drop-shadow-xs" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-display">
            SiDetek<span className="text-[#2563EB] dark:text-[#3B82F6]"> APD</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            Automated PPE Compliance &amp; Incident Prevention Platform
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username / Email Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="identifier"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
            >
              Username or Email
            </label>
            <div className="relative group">
              <UserIcon className="w-4 h-4 text-slate-400 group-focus-within:text-[#2563EB] dark:group-focus-within:text-[#3B82F6] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your username or email"
                autoComplete="username"
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:bg-white dark:focus:bg-[#0B1220] focus:ring-2 focus:ring-blue-500/15 transition-all"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
            >
              Password
            </label>
            <div className="relative group">
              <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#2563EB] dark:group-focus-within:text-[#3B82F6] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoComplete="current-password"
                disabled={isLoading}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] focus:bg-white dark:focus:bg-[#0B1220] focus:ring-2 focus:ring-blue-500/15 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] dark:from-[#3B82F6] dark:to-[#2563EB] text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Authenticating...</span>
              </span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Card Footer Subtext */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span>Enterprise Jobsite Safety &amp; K3 Compliance Management</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070C18] flex items-center justify-center p-4 selection:bg-[#2563EB] selection:text-white relative overflow-hidden transition-colors duration-200">
      {/* Background Ambient Lighting Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Subtle Geometric Grid Backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

      <Suspense
        fallback={
          <div className="text-slate-400 text-xs font-mono animate-pulse">
            Loading SiDetek APD...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
