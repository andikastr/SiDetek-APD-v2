"use client";

import { useState } from "react";
import { UploadCloud, Radio, Sparkles } from "lucide-react";
import ImageDetector from "@/components/ImageDetector";
import WebcamDetector from "@/components/WebcamDetector";

export default function DetectStudioPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "webcam">("upload");

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Floating Switcher Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
        <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1626] p-1 shadow-sm dark:shadow-md text-xs font-semibold transition-colors">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-[#2563EB] text-white font-semibold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Image Inspection</span>
          </button>
          <button
            onClick={() => setActiveTab("webcam")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "webcam"
                ? "bg-[#2563EB] text-white font-semibold shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>CCTV &amp; Live Webcam</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono transition-colors">
          <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
          <span>REAL-TIME INFERENCE: ACTIVE</span>
          <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
          <span className="hidden sm:inline">EN 397 &amp; EN ISO 20471</span>
        </div>
      </div>

      {/* Inspection Mode Viewport */}
      <div>
        {activeTab === "upload" ? <ImageDetector /> : <WebcamDetector />}
      </div>
    </div>
  );
}
