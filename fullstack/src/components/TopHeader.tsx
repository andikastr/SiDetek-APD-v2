"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Calendar, ScanSearch, Printer, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { checkAIHealth } from "@/lib/ai-client";

export default function TopHeader() {
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState<string>("");
  const [aiOnline, setAiOnline] = useState<boolean>(false);

  useEffect(() => {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(now);
    setCurrentDate(formatted);

    checkAIHealth().then((res) => setAiOnline(res.healthy));
  }, []);

  const pageMeta: Record<string, { title: string; subtitle: string }> = {
    "/": { title: "Executive Overview", subtitle: "Jobsite Safety Summary & K3 Compliance" },
    "/detect": { title: "Detection Studio", subtitle: "Real-Time Image, Webcam & RTSP IP Camera Inspection" },
    "/history": { title: "Audit Log", subtitle: "Historical Inspection Records & Compliance Evidence" },
    "/analytics": { title: "Safety Analytics", subtitle: "PPE Compliance Rates, Trends & Incident Prevention" },
  };

  const current = pageMeta[pathname] || {
    title: "SiDetek-APD",
    subtitle: "AI Safety Vision System",
  };

  return (
    <header className="no-print h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 transition-all">
      {/* Left: Clean Page Title */}
      <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
        {current.title}
      </h1>

      {/* Right: Telemetry Capsule, Date, and Action */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Signature AI Telemetry Capsule */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200 text-xs font-technical text-slate-700">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                aiOnline ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                aiOnline ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
          </span>
          <span className="font-semibold text-slate-900">
            {aiOnline ? "ONNX Engine" : "Connecting"}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">ISO 20471 / EN 397</span>
        </div>

        {/* Date Display */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-technical px-2.5 py-1.5 rounded-lg border border-slate-200/60 bg-white">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentDate}</span>
        </div>

        {/* Action Button */}
        {pathname !== "/detect" ? (
          <Link
            href="/detect"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all hover:shadow-sm active:scale-98"
          >
            <ScanSearch className="w-3.5 h-3.5 text-amber-400" />
            <span>Launch Studio</span>
          </Link>
        ) : (
          <Link
            href="/history"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-all"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit Log</span>
          </Link>
        )}
      </div>
    </header>
  );
}
