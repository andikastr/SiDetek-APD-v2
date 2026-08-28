"use client";

import React from "react";
import FloatingNavbar from "@/components/FloatingNavbar";
import { ThemeProvider } from "@/components/ThemeContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-[#F8FAFC] flex flex-col antialiased selection:bg-[#2563EB] selection:text-white relative overflow-x-hidden transition-colors duration-200">
        {/* Floating Navbar */}
        <FloatingNavbar />

        {/* Main Content Workspace Container */}
        <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Enterprise Footer */}
        <footer className="no-print border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1626] py-6 px-6 sm:px-8 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md bg-[#2563EB] flex items-center justify-center text-[10px] font-bold text-white">
                S
              </div>
              <span className="font-bold text-slate-900 dark:text-white tracking-wide font-display uppercase">
                SiDetek-APD
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-slate-500 dark:text-slate-400">The Next-Gen Safety Intelligence Operating System</span>
            </div>

            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>EN 397 (Safety Helmets)</span>
              </div>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>EN ISO 20471 (High-Vis Vests)</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
