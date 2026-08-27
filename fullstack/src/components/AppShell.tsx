"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { SidebarProvider, useSidebar } from "@/components/SidebarContext";
import { ShieldCheck } from "lucide-react";

function ShellInner({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col antialiased selection:bg-slate-900 selection:text-white">
      {/* Tactical Collapsible Left Sidebar */}
      <Sidebar />

      {/* Main Content Viewport with Dynamic Fluid Padding */}
      <div
        className={`flex flex-col flex-1 min-h-screen transition-[padding] duration-300 ease-in-out ${
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        }`}
      >
        <TopHeader />

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <footer className="no-print border-t border-slate-200/80 bg-white/80 backdrop-blur-sm py-4 px-6 sm:px-8 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">SiDetek-APD</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500">High-Performance Pure ONNX Vision System</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 font-technical">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Compliance Specs: EN 397 (Helmets) &amp; EN ISO 20471 (Vests)</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <ShellInner>{children}</ShellInner>
    </SidebarProvider>
  );
}
