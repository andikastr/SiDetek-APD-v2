"use client";

import { useState, useRef, ChangeEvent } from "react";
import {
  UploadCloud,
  FolderOpen,
  ImagePlus,
  Check,
  Sliders,
  RefreshCw,
  Save,
  Scan,
  ChevronLeft,
  ChevronRight,
  Shield,
  HardHat,
  AlertCircle,
} from "lucide-react";
import { DetectionResponse, DetectedObject } from "@/types";
import { detectPPE } from "@/lib/ai-client";
import ComplianceBadge from "./ComplianceBadge";

export default function ImageDetector() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(0.65);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"interactive" | "annotated">("interactive");
  const [hoveredBox, setHoveredBox] = useState<DetectedObject | null>(null);

  const [classFilter, setClassFilter] = useState<"all" | "helmet" | "vest">("all");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDetectionResult(null);
      setErrorMsg(null);
      setSaveSuccess(false);
      setDrawerOpen(true);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDetectionResult(null);
      setErrorMsg(null);
      setSaveSuccess(false);
      setDrawerOpen(true);
    }
  };

  const handleRunDetection = async () => {
    if (!selectedFile) return;

    setIsDetecting(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const result = await detectPPE(selectedFile, confidence);
      setDetectionResult(result);
      setDrawerOpen(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect to AI Engine.";
      setErrorMsg(message);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSaveAudit = async () => {
    if (!detectionResult || !previewUrl) return;

    setIsSaving(true);
    try {
      const payload = {
        source: "UPLOAD",
        fileName: selectedFile?.name || "Image_Upload.jpg",
        annotatedImageBase64: detectionResult.annotated_image_base64,
        complianceStatus: detectionResult.compliance.status,
        complianceScore: detectionResult.compliance.compliance_score,
        helmetCount: detectionResult.compliance.helmet_count,
        jacketCount: detectionResult.compliance.jacket_count,
        totalDetected: detectionResult.compliance.total_detected,
        inferenceMs: detectionResult.inference_time_ms,
        objects: detectionResult.objects,
      };

      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save to database.");
      setSaveSuccess(true);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to save audit record.");
    } finally {
      setIsSaving(false);
    }
  };

  const visibleObjects = (detectionResult?.objects || []).filter((obj) => {
    if (classFilter === "all") return true;
    const isHelmet = obj.label.toLowerCase().includes("helmet");
    if (classFilter === "helmet") return isHelmet;
    if (classFilter === "vest") return !isHelmet;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Confidence Threshold Slider */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500 font-medium flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-500" /> Threshold:
          </span>
          <span className="font-semibold text-gray-800">
            {Math.round(confidence * 100)}%
          </span>
          <input
            type="range"
            min="0.1"
            max="0.9"
            step="0.05"
            value={confidence}
            onChange={(e) => setConfidence(parseFloat(e.target.value))}
            className="w-24 sm:w-28 accent-amber-500 cursor-pointer"
          />
        </div>

        {/* Center: Class Filter Tabs */}
        {detectionResult && (
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-md border border-gray-200 text-xs">
            <button
              onClick={() => setClassFilter("all")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                classFilter === "all"
                  ? "bg-white text-[#0a1b5c] shadow-2xs font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({detectionResult.objects.length})
            </button>
            <button
              onClick={() => setClassFilter("helmet")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                classFilter === "helmet"
                  ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                  : "text-gray-600 hover:text-emerald-700"
              }`}
            >
              <HardHat className="w-3 h-3 text-emerald-600" />
              Helmets ({detectionResult.compliance.helmet_count})
            </button>
            <button
              onClick={() => setClassFilter("vest")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                classFilter === "vest"
                  ? "bg-white text-amber-700 shadow-2xs font-semibold"
                  : "text-gray-600 hover:text-amber-700"
              }`}
            >
              <Shield className="w-3 h-3 text-amber-600" />
              Vests ({detectionResult.compliance.jacket_count})
            </button>
          </div>
        )}

        {/* Right: View Mode & Trigger Detection */}
        <div className="flex items-center gap-2.5 justify-end">
          {detectionResult && (
            <div className="flex rounded-md border border-gray-200 bg-gray-50 p-0.5 text-xs">
              <button
                onClick={() => setViewMode("interactive")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "interactive"
                    ? "bg-white text-[#0a1b5c] shadow-2xs font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Vector
              </button>
              <button
                onClick={() => setViewMode("annotated")}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === "annotated"
                    ? "bg-white text-[#0a1b5c] shadow-2xs font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                AI Plot
              </button>
            </div>
          )}

          {previewUrl && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-[#0a1b5c] text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Select another worker photo"
            >
              <ImagePlus className="w-3.5 h-3.5 text-[#0a1b5c]" />
              <span>Change Image</span>
            </button>
          )}

          <button
            onClick={handleRunDetection}
            disabled={!selectedFile || isDetecting}
            className="px-4 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
          >
            {isDetecting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Scan className="w-3.5 h-3.5" />
                <span>Run Detection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Focus Stage Workspace */}
      <div className={`relative rounded-2xl overflow-hidden min-h-[540px] flex items-center justify-center transition-all ${
        !previewUrl 
          ? "border-2 border-dashed border-gray-300 hover:border-[#0a1b5c] bg-white hover:bg-slate-50/60 shadow-xs" 
          : "border border-gray-200 bg-slate-950 shadow-sm"
      }`}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {!previewUrl ? (
          /* Redesigned Clean Enterprise Dropzone */
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="group w-full h-full min-h-[540px] p-8 sm:p-14 cursor-pointer flex flex-col items-center justify-center text-center space-y-4"
          >
            {/* Elegant Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 text-[#0a1b5c] flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-[#0a1b5c] group-hover:text-white transition-all">
              <UploadCloud className="w-8 h-8 transition-colors" />
            </div>

            <div className="max-w-md space-y-1.5 pt-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
                Drag and drop worker image here
              </h3>
              <p className="text-xs text-gray-500">
                or click anywhere in this area to select from your device
              </p>
            </div>

            {/* Clean Single Action Button */}
            <div className="pt-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0a1b5c] hover:bg-[#0d327f] text-white text-xs font-semibold shadow-xs transition-colors pointer-events-none"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>Browse Image File</span>
              </button>
            </div>

            {/* Format & Resolution Specs */}
            <div className="pt-4 flex items-center gap-2 text-[11px] text-gray-400 font-medium">
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[10px]">JPG</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[10px]">PNG</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-mono text-[10px]">WEBP</span>
              <span className="text-gray-300">•</span>
              <span>Up to 4K resolution (max 15MB)</span>
            </div>
          </div>
        ) : (
          /* Loaded Image & Interactive SVG Viewport */
          <div className="relative w-full h-full min-h-[560px] flex items-center justify-center bg-slate-950 p-4">
            {/* Top-Left Floating Change Photo Pill (Immediately visible without scrolling) */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-3 left-3 z-20 px-3.5 py-1.5 rounded-lg bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-2 shadow-lg cursor-pointer group"
              title="Click to upload another worker photo"
            >
              <ImagePlus className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Change Photo</span>
              {selectedFile && (
                <span className="text-[11px] text-gray-300 font-normal max-w-[140px] truncate border-l border-white/20 pl-2">
                  {selectedFile.name}
                </span>
              )}
            </button>
            {viewMode === "annotated" && detectionResult?.annotated_image_base64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/jpeg;base64,${detectionResult.annotated_image_base64}`}
                alt="Annotated Frame"
                className="max-h-[560px] w-auto object-contain rounded-lg shadow-sm"
              />
            ) : (
              <div className="relative inline-block max-h-[560px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Source Worker"
                  className="max-h-[560px] w-auto object-contain rounded-lg block shadow-sm"
                />

                {/* SVG Bounding Boxes Overlay */}
                {detectionResult && (
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 ${detectionResult.image_width} ${detectionResult.image_height}`}
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <filter id="bbox-glow" x="-15%" y="-15%" width="130%" height="130%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.85" />
                      </filter>
                    </defs>
                    {visibleObjects.map((obj, i) => {
                      const isHelmet = obj.label.toLowerCase().includes("helmet");
                      const strokeColor = isHelmet ? "#00e676" : "#ff9100";
                      const isHovered = hoveredBox === obj;

                      // Dynamically calculate stroke and font size based on image resolution
                      const baseDim = Math.max(detectionResult.image_width, detectionResult.image_height);
                      const baseStroke = Math.max(3, Math.round(baseDim * 0.0035));
                      const strokeWidth = isHovered ? Math.round(baseStroke * 1.5) : baseStroke;
                      const fontSize = Math.max(14, Math.round(baseDim * 0.016));
                      const badgeH = Math.round(fontSize * 1.5);
                      const badgeY = Math.max(0, obj.bbox.y1 - badgeH - Math.round(baseStroke * 0.4));
                      const labelText = `${obj.label} ${Math.round(obj.confidence * 100)}%`;
                      const badgeW = Math.max(Math.round(fontSize * (labelText.length * 0.62 + 1.2)), Math.round(obj.bbox.width * 0.45));

                      return (
                        <g
                          key={i}
                          className="pointer-events-auto cursor-pointer"
                          onMouseEnter={() => setHoveredBox(obj)}
                          onMouseLeave={() => setHoveredBox(null)}
                          filter="url(#bbox-glow)"
                        >
                          <rect
                            x={obj.bbox.x1}
                            y={obj.bbox.y1}
                            width={obj.bbox.width}
                            height={obj.bbox.height}
                            fill={
                              isHovered
                                ? isHelmet
                                  ? "rgba(0, 230, 118, 0.35)"
                                  : "rgba(255, 145, 0, 0.35)"
                                : isHelmet
                                ? "rgba(0, 230, 118, 0.18)"
                                : "rgba(255, 145, 0, 0.18)"
                            }
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            rx={Math.max(3, Math.round(baseDim * 0.002))}
                          />
                          {/* High-visibility pill badge with black text */}
                          <rect
                            x={obj.bbox.x1}
                            y={badgeY}
                            width={badgeW}
                            height={badgeH}
                            fill={strokeColor}
                            rx={Math.max(3, Math.round(baseDim * 0.0015))}
                          />
                          <text
                            x={obj.bbox.x1 + Math.round(fontSize * 0.5)}
                            y={badgeY + Math.round(fontSize * 1.12)}
                            fill="#000000"
                            fontSize={fontSize}
                            fontWeight="900"
                            fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
                            letterSpacing="0.4px"
                          >
                            {labelText}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                )}
              </div>
            )}

            {/* Bottom-Left Image Specs & Latency */}
            {detectionResult && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[11px] text-white/80 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm">
                <span>{detectionResult.image_width}×{detectionResult.image_height}</span>
                <span>•</span>
                <span className="text-amber-400 font-mono font-semibold">{detectionResult.inference_time_ms} ms</span>
              </div>
            )}

            {/* Retractable Floating Drawer */}
            {detectionResult && (
              <div
                className={`absolute top-4 bottom-4 right-4 z-20 flex transition-all duration-300 ${
                  drawerOpen ? "translate-x-0" : "translate-x-[calc(100%-2.25rem)]"
                }`}
              >
                {/* Drawer Toggle Tab */}
                <button
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="self-center bg-white hover:bg-gray-50 text-[#0a1b5c] p-2 rounded-l-lg border-y border-l border-gray-200 shadow-md flex items-center gap-1 text-xs font-semibold"
                  title={drawerOpen ? "Close Drawer" : "Open Drawer"}
                >
                  {drawerOpen ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      <ChevronLeft className="w-4 h-4" />
                      <span className="[writing-mode:vertical-rl] rotate-180 uppercase tracking-wider text-[10px]">
                        Results ({detectionResult.compliance.compliance_score}%)
                      </span>
                    </div>
                  )}
                </button>

                {/* Drawer Content */}
                <div className="w-72 sm:w-80 bg-white/95 backdrop-blur-md border border-gray-200 rounded-r-xl p-5 shadow-xl flex flex-col justify-between overflow-y-auto space-y-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-gray-400 block">
                          Safety Status
                        </span>
                        <div className="mt-1">
                          <ComplianceBadge
                            status={detectionResult.compliance.status}
                            size="md"
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-400 block">SCORE</span>
                        <span className="text-2xl font-bold text-[#0a1b5c]">
                          {detectionResult.compliance.compliance_score}%
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {detectionResult.compliance.message}
                    </p>

                    {/* Count Boxes */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                        <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                          <HardHat className="w-3.5 h-3.5" /> Helmets
                        </span>
                        <span className="text-lg font-bold text-gray-900 block mt-1">
                          {detectionResult.compliance.helmet_count}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80">
                        <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Vests
                        </span>
                        <span className="text-lg font-bold text-gray-900 block mt-1">
                          {detectionResult.compliance.jacket_count}
                        </span>
                      </div>
                    </div>

                    {/* Recommendations */}
                    {detectionResult.compliance.recommendations.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 space-y-1">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase">
                          Action Items:
                        </span>
                        <ul className="space-y-1 text-xs text-gray-600">
                          {detectionResult.compliance.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-[#0a1b5c]">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="pt-3 border-t border-gray-100">
                    <button
                      onClick={handleSaveAudit}
                      disabled={isSaving || saveSuccess}
                      className={`w-full py-2.5 px-4 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
                        saveSuccess
                          ? "bg-emerald-600 text-white cursor-default"
                          : "bg-[#0a1b5c] hover:bg-[#0a1b5c]/90 text-white"
                      }`}
                    >
                      {saveSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Saved to Log</span>
                        </>
                      ) : isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save to Audit Log</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
