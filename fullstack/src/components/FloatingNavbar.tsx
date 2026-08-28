"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HardHat,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { checkAIHealth } from "@/lib/ai-client";
import { useTheme } from "@/components/ThemeContext";

export default function FloatingNavbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [engineOnline, setEngineOnline] = useState<boolean>(false);

  // Periodic heartbeat check to AI Engine
  useEffect(() => {
    let isMounted = true;
    const checkEngine = async () => {
      try {
        const res = await checkAIHealth();
        if (isMounted) setEngineOnline(res.healthy);
      } catch {
        if (isMounted) setEngineOnline(false);
      }
    };
    checkEngine();
    const interval = setInterval(checkEngine, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navLinks = [
    { label: "Overview", href: "/" },
    { label: "Detection Studio", href: "/detect" },
    { label: "Audit Records", href: "/history" },
    { label: "Analytics", href: "/analytics" },
  ];

  return (
    <>
      <header className="fixed top-4 left-0 right-0 z-40 flex justify-center px-4 no-print pointer-events-none">
        <nav className="pointer-events-auto flex items-center justify-between gap-4 sm:gap-6 px-5 sm:px-6 py-2.5 rounded-xl bg-white/95 dark:bg-[#0E1626]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 shadow-sm dark:shadow-md max-w-5xl w-full transition-colors duration-200">
          {/* Brand Glyph & Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center font-bold text-white text-sm transition-transform group-hover:scale-105">
              <HardHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold tracking-tight text-base sm:text-lg uppercase font-display text-slate-900 dark:text-white transition-colors">
              SiDetek<span className="text-[#2563EB] dark:text-[#3B82F6]">.AI</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 text-xs font-medium">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? "text-slate-900 dark:text-white font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Action & Status Group */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Live Engine Status Indicator */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[10px] font-mono tracking-wider text-slate-600 dark:text-slate-300 transition-colors"
              title={engineOnline ? "AI Engine Online (ONNX)" : "AI Engine Offline"}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  engineOnline
                    ? "bg-emerald-500 dark:bg-emerald-400"
                    : "bg-rose-500"
                }`}
              />
              <span>{engineOnline ? "ONNX ONLINE" : "DISCONNECTED"}</span>
            </div>

            {/* Sun / Moon Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Light and Dark Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Slide-down Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-4 top-20 z-40 md:hidden bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xl space-y-3 no-print animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2 font-mono">
            <span className="text-[11px]">System Status:</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  engineOnline ? "bg-emerald-500 dark:bg-emerald-400" : "bg-rose-500"
                }`}
              />
              <span className="text-slate-900 dark:text-white text-[11px]">
                {engineOnline ? "AI Engine Active" : "Engine Offline"}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
