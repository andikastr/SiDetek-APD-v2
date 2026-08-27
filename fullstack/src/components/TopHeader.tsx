"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Calendar, ScanSearch, Printer } from "lucide-react";
import { useEffect, useState } from "react";

export default function TopHeader() {
  const pathname = usePathname();
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(now);
    setCurrentDate(formatted);
  }, []);

  const pageTitles: Record<string, string> = {
    "/": "Executive Overview",
    "/detect": "Detection Studio",
    "/history": "Audit Log",
    "/analytics": "Safety Analytics",
  };

  const title = pageTitles[pathname] || "SiDetek-APD";

  return (
    <div className="no-print h-14 bg-[#0a1b5c] text-white px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <h1 className="text-sm sm:text-base font-semibold tracking-tight text-white">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {/* Date */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-white/75 font-normal">
          <Calendar className="w-3.5 h-3.5 text-white/60" />
          <span>{currentDate}</span>
        </div>

        {/* Action Button */}
        {pathname !== "/detect" ? (
          <Link
            href="/detect"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-colors"
          >
            <ScanSearch className="w-3.5 h-3.5 text-amber-400" />
            <span>Start Inspection</span>
          </Link>
        ) : (
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/20 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-white/80" />
            <span>Audit Log</span>
          </Link>
        )}
      </div>
    </div>
  );
}
