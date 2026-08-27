"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  ScanSearch,
  ClipboardList,
  BarChart3,
  HardHat,
  Menu,
  X,
  Cpu,
} from "lucide-react";
import { checkAIHealth } from "@/lib/ai-client";

export default function Sidebar() {
  const pathname = usePathname();
  const [aiStatus, setAiStatus] = useState<"checking" | "online" | "offline">("checking");
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const verifyHealth = async () => {
      const res = await checkAIHealth();
      if (mounted) {
        setAiStatus(res.healthy ? "online" : "offline");
      }
    };
    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/detect", label: "Detection Studio", icon: ScanSearch },
    { href: "/history", label: "Audit Log", icon: ClipboardList },
    { href: "/analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden no-print flex items-center justify-between px-5 h-14 bg-[#0a1b5c] text-white sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white text-[#0a1b5c] flex items-center justify-center font-bold">
            <HardHat className="w-4 h-4 text-amber-500" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">
            SiDetek-APD
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md text-white/80 hover:bg-white/10"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden no-print"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 no-print ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top: Clean Brand Header */}
        <div>
          <div className="h-14 px-6 flex items-center gap-3 border-b border-gray-200 bg-white">
            <div className="w-8 h-8 rounded-lg bg-[#0a1b5c] text-amber-400 flex items-center justify-center shadow-xs">
              <HardHat className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#e36124] block leading-none">
                ARTHA IT
              </span>
              <span className="font-bold text-base text-gray-900 tracking-tight block mt-0.5">
                SiDetek-APD
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#0a1b5c] text-white shadow-xs"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? "text-amber-400" : "text-gray-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Minimal Clean Status Indicator */}
        <div className="p-5 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-gray-400" />
              AI Engine
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600">
              <span
                className={`w-2 h-2 rounded-full ${
                  aiStatus === "online"
                    ? "bg-emerald-500"
                    : aiStatus === "checking"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              {aiStatus === "online" ? "Online" : aiStatus === "checking" ? "Connecting" : "Offline"}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
