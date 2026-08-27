"use client";

import { useState } from "react";
import { UploadCloud, Video } from "lucide-react";
import ImageDetector from "@/components/ImageDetector";
import WebcamDetector from "@/components/WebcamDetector";

export default function DetectStudioPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "webcam">("upload");

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Clean Mode Switcher Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex rounded-xl border border-slate-200/80 bg-white p-1 shadow-2xs text-xs font-semibold">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "upload"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <UploadCloud className="w-4 h-4 text-amber-400" />
            <span>Image Inspection</span>
          </button>
          <button
            onClick={() => setActiveTab("webcam")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "webcam"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Video className="w-4 h-4 text-emerald-400" />
            <span>CCTV &amp; Live Webcam</span>
          </button>
        </div>

        <span className="hidden sm:inline-block text-[11px] text-slate-500 font-technical">
          Standards: EN 397 · EN ISO 20471
        </span>
      </div>

      {/* Inspection Mode Viewport */}
      <div>
        {activeTab === "upload" ? <ImageDetector /> : <WebcamDetector />}
      </div>
    </div>
  );
}
