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
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { checkAIHealth } from "@/lib/ai-client";
import { useSidebar } from "@/components/SidebarContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();
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
    { href: "/analytics", label: "Safety Analytics", icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden no-print flex items-center justify-between px-5 h-15 bg-white border-b border-slate-200 text-slate-900 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-xs">
            <HardHat className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 block">
              SiDetek-APD
            </span>
            <span className="text-[9px] uppercase tracking-wider text-amber-600 font-semibold block leading-none">
              K3 Vision System
            </span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden no-print"
        />
      )}

      {/* Desktop & Mobile Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-all duration-300 ease-in-out lg:translate-x-0 no-print ${
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-64"}`}
      >
        {/* Top: Brand Header & Navigation */}
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Header with Top Collapse/Expand Toggle (<< / >>) */}
          <div
            className={`h-16 flex items-center border-b border-slate-100 transition-all ${
              isCollapsed ? "justify-center px-2" : "justify-between px-4"
            }`}
          >
            {isCollapsed ? (
              /* Top Expand Toggle Button (>>) */
              <button
                onClick={toggleSidebar}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-900 text-slate-700 hover:text-amber-400 flex items-center justify-center transition-all cursor-pointer group shadow-2xs"
                title="Expand sidebar (>>)"
                aria-label="Expand sidebar"
              >
                <ChevronsRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              /* Full Header with Collapse Toggle Button (<<) */
              <>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs flex-shrink-0">
                    <HardHat className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-slate-900 tracking-tight block">
                      SiDetek-APD
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-amber-600 font-semibold block leading-none">
                      K3 Safety Vision
                    </span>
                  </div>
                </div>

                {/* Top Collapse Button (<<) */}
                <button
                  onClick={toggleSidebar}
                  className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer group"
                  title="Collapse sidebar (<<)"
                  aria-label="Collapse sidebar"
                >
                  <ChevronsLeft className="w-4.5 h-4.5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </>
            )}
          </div>

          {/* Nav Items */}
          <nav className="p-3 space-y-1.5 mt-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <div key={item.href} className="relative group">
                  <Link
                    href={item.href}
                    className={`flex items-center rounded-xl text-xs font-semibold transition-all ${
                      isCollapsed
                        ? "justify-center w-11 h-11 mx-auto"
                        : "gap-3 px-3.5 py-2.5"
                    } ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon
                      className={`w-4.5 h-4.5 flex-shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-700"
                      }`}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>

                  {/* Tooltip on Collapsed Mode */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden lg:group-hover:flex items-center z-50 pointer-events-none">
                      <div className="bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap">
                        {item.label}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: AI Engine Status & Collapse Toggle */}
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
          {/* AI Engine Status Card */}
          {!isCollapsed ? (
            <div className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px]">
                  <Cpu className="w-3.5 h-3.5 text-slate-400" />
                  AI Engine
                </span>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 font-technical">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      aiStatus === "online"
                        ? "bg-emerald-500"
                        : aiStatus === "checking"
                        ? "bg-amber-400 animate-pulse"
                        : "bg-rose-500"
                    }`}
                  />
                  {aiStatus === "online" ? "Pure ONNX" : aiStatus === "checking" ? "Warming..." : "Offline"}
                </span>
              </div>
            </div>
          ) : (
            /* Collapsed Status Dot with Tooltip */
            <div className="relative group flex justify-center py-1">
              <div
                className={`w-3 h-3 rounded-full ${
                  aiStatus === "online"
                    ? "bg-emerald-500"
                    : aiStatus === "checking"
                    ? "bg-amber-400 animate-pulse"
                    : "bg-rose-500"
                }`}
              />
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden lg:group-hover:flex items-center z-50 pointer-events-none">
                <div className="bg-slate-900 text-white text-[11px] font-medium px-2.5 py-1 rounded shadow-lg whitespace-nowrap">
                  AI Engine: {aiStatus === "online" ? "Pure ONNX Online" : aiStatus}
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
