"use client";

import { useState } from "react";
import { Upload, Radio } from "lucide-react";
import ImageDetector from "@/components/ImageDetector";
import WebcamDetector from "@/components/WebcamDetector";

export default function DetectStudioPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "webcam">("upload");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Studio Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            PPE Detection Studio
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time visual compliance verification for safety helmets and reflective vests.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg border border-gray-200 bg-white p-1 shadow-2xs text-xs">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-medium transition-all ${
              activeTab === "upload"
                ? "bg-[#0a1b5c] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
          <button
            onClick={() => setActiveTab("webcam")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md font-medium transition-all ${
              activeTab === "webcam"
                ? "bg-[#0a1b5c] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Live CCTV &amp; Webcam</span>
          </button>
        </div>
      </div>

      {activeTab === "upload" ? <ImageDetector /> : <WebcamDetector />}
    </div>
  );
}
