"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  ListFilter,
  Layers,
  MousePointer,
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

  // Zoom & Pan state
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedObjectIdx, setSelectedObjectIdx] = useState<number | null>(null);
  const [showCtrlHint, setShowCtrlHint] = useState<boolean>(false);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter & Drawer state
  const [classFilter, setClassFilter] = useState<"all" | "helmet" | "vest">("all");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  const [drawerTab, setDrawerTab] = useState<"summary" | "objects">("summary");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stageViewportRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);

  const resetAllZoom = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setSelectedObjectIdx(null);
    setHoveredBox(null);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDetectionResult(null);
      setErrorMsg(null);
      setSaveSuccess(false);
      setDrawerOpen(true);
      setDrawerTab("summary");
      resetAllZoom();
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
      setDrawerTab("summary");
      resetAllZoom();
    }
  };

  const handleRunDetection = async () => {
    if (!selectedFile) return;

    setIsDetecting(true);
    setErrorMsg(null);
    setSaveSuccess(false);
    resetAllZoom();

    try {
      const result = await detectPPE(selectedFile, confidence);
      setDetectionResult(result);
      setDrawerOpen(true);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "AI Engine connection error. Make sure FastAPI server is running."
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSaveAudit = async () => {
    if (!detectionResult) return;

    setIsSaving(true);
    try {
      const payload = {
        source: "UPLOAD",
        fileName: selectedFile?.name || "inspected_worker.jpg",
        annotatedImageBase64: detectionResult.annotated_image_base64 || null,
        complianceStatus: detectionResult.compliance.status,
        complianceScore: detectionResult.compliance.compliance_score,
        helmetCount: detectionResult.compliance.helmet_count,
        jacketCount: detectionResult.compliance.jacket_count,
        totalDetected: detectionResult.objects.length,
        inferenceMs: detectionResult.inference_time_ms,
        notes:
          detectionResult.compliance.recommendations.join("; ") ||
          detectionResult.compliance.message,
        objects: detectionResult.objects,
      };

      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(
          errJson.error || errJson.details || "Failed to save audit record to database"
        );
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save audit error:", err);
      alert(err instanceof Error ? err.message : "Error saving record to database.");
    } finally {
      setIsSaving(false);
    }
  };

  // Native non-passive Wheel listener (Listens ONLY to Ctrl + Scroll for zooming!)
  useEffect(() => {
    const el = stageViewportRef.current;
    if (!el) return;

    const onWheelNative = (e: WheelEvent) => {
      if (!previewUrl) return;

      // If mouse is inside the compliance drawer, zoom dock, or any UI button/control,
      // let it scroll naturally and DO NOT zoom the image!
      const target = e.target as HTMLElement | null;
      if (
        target?.closest(".compliance-drawer") ||
        target?.closest(".zoom-dock") ||
        target?.closest("button") ||
        target?.closest(".no-drag")
      ) {
        return;
      }

      // ONLY zoom if Ctrl key (or Cmd on Mac) is held down!
      if (e.ctrlKey || e.metaKey) {
        // Crucial: preventDefault stops BOTH the browser's own UI zoom AND page scroll!
        e.preventDefault();
        e.stopPropagation();

        const delta = e.deltaY < 0 ? 0.25 : -0.25;
        setZoomScale((prev) => {
          const next = Math.min(4, Math.max(1, Math.round((prev + delta) * 100) / 100));
          if (next === 1) {
            setPanPosition({ x: 0, y: 0 });
            setSelectedObjectIdx(null);
          }
          return next;
        });
      } else {
        // If Ctrl is NOT pressed: let the web page scroll normally and show brief hint
        setShowCtrlHint(true);
        if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
        hintTimeoutRef.current = setTimeout(() => setShowCtrlHint(false), 1400);
      }
    };

    el.addEventListener("wheel", onWheelNative, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheelNative);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
    };
  }, [previewUrl]);

  // Double Click Handler: Toggle 1x / 2x zoom smoothly
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewUrl) return;
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest(".no-drag")) return;
    if (zoomScale > 1) {
      resetAllZoom();
    } else {
      setZoomScale(2);
    }
  };

  // Drag to Pan Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomScale <= 1) return;
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest(".no-drag")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Auto-focus and zoom onto a specific detected object
  const handleFocusObject = (obj: DetectedObject, index: number) => {
    setSelectedObjectIdx(index);
    setHoveredBox(obj);
    if (!detectionResult) return;

    const targetZoom = 2.2;
    setZoomScale(targetZoom);

    const imgW = detectionResult.image_width;
    const imgH = detectionResult.image_height;
    const boxCenterX = (obj.bbox.x1 + obj.bbox.x2) / 2;
    const boxCenterY = (obj.bbox.y1 + obj.bbox.y2) / 2;

    const normDeltaX = (imgW / 2 - boxCenterX) / imgW;
    const normDeltaY = (imgH / 2 - boxCenterY) / imgH;

    const stageEl = imageWrapperRef.current;
    const renderedW = stageEl ? stageEl.offsetWidth : 600;
    const renderedH = stageEl ? stageEl.offsetHeight : 450;

    const panX = normDeltaX * renderedW * targetZoom;
    const panY = normDeltaY * renderedH * targetZoom;

    setPanPosition({ x: panX, y: panY });
  };

  // Filter objects based on class filter
  const visibleObjects = (detectionResult?.objects || []).filter((obj) => {
    const isHelmet = obj.label.toLowerCase().includes("helmet");
    if (classFilter === "helmet") return isHelmet;
    if (classFilter === "vest") return !isHelmet;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white px-5 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        {/* Left: Confidence Threshold Slider */}
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-500" /> Threshold:
          </span>
          <span className="font-extrabold text-slate-900 font-technical">
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
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setClassFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                classFilter === "all"
                  ? "bg-white text-slate-900 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({detectionResult.objects.length})
            </button>
            <button
              onClick={() => setClassFilter("helmet")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                classFilter === "helmet"
                  ? "bg-white text-emerald-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-emerald-700"
              }`}
            >
              <HardHat className="w-3 h-3 text-emerald-600" />
              Helmets ({detectionResult.compliance.helmet_count})
            </button>
            <button
              onClick={() => setClassFilter("vest")}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                classFilter === "vest"
                  ? "bg-white text-amber-700 shadow-2xs font-bold"
                  : "text-slate-600 hover:text-amber-700"
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
            <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setViewMode("interactive")}
                className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "interactive"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Vector
              </button>
              <button
                onClick={() => setViewMode("annotated")}
                className={`px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "annotated"
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                AI Plot
              </button>
            </div>
          )}

          {previewUrl && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Select another worker photo"
            >
              <ImagePlus className="w-3.5 h-3.5 text-slate-700" />
              <span>Change Image</span>
            </button>
          )}

          <button
            onClick={handleRunDetection}
            disabled={!selectedFile || isDetecting}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {isDetecting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Scan className="w-3.5 h-3.5 text-amber-400" />
                <span>Run Detection</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Focus Stage Workspace (Accepts drop files anytime) */}
      <div
        ref={stageViewportRef}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative rounded-3xl overflow-hidden min-h-[560px] flex items-center justify-center transition-all select-none ${
          !previewUrl
            ? "border-2 border-dashed border-slate-300 hover:border-slate-800 bg-white hover:bg-slate-50/70 shadow-xs cursor-pointer"
            : `border border-slate-200 bg-slate-950 shadow-sm tactical-viewport ${
                zoomScale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
              }`
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {!previewUrl ? (
          /* Clean Enterprise Dropzone */
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group w-full h-full min-h-[560px] p-8 sm:p-14 flex flex-col items-center justify-center text-center space-y-4"
          >
            {/* Elegant Icon Badge */}
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-slate-900 group-hover:text-amber-400 transition-all">
              <UploadCloud className="w-8 h-8 transition-colors" />
            </div>

            <div className="max-w-md space-y-1.5 pt-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Drag and drop worker image here
              </h3>
              <p className="text-xs text-slate-500">
                or click anywhere in this area to select from your device
              </p>
            </div>

            {/* Clean Single Action Button */}
            <div className="pt-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors pointer-events-none"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>Browse Image File</span>
              </button>
            </div>

            {/* Format & Resolution Specs */}
            <div className="pt-4 flex items-center gap-2 text-[11px] text-slate-400 font-medium font-technical">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">JPG</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">PNG</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">WEBP</span>
              <span className="text-slate-300">•</span>
              <span>Up to 4K resolution (max 15MB)</span>
            </div>
          </div>
        ) : (
          /* Loaded Image & Interactive SVG Viewport with Zoom/Pan GPU Transform */
          <div className="relative w-full h-full min-h-[560px] flex items-center justify-center bg-slate-950 p-4 overflow-hidden">
            {/* Top-Left Floating Change Photo Pill */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute top-3 left-3 z-20 px-3.5 py-1.5 rounded-xl bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-2 shadow-lg cursor-pointer group no-drag"
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

            {/* Image Canvas with Transform */}
            <div
              ref={imageWrapperRef}
              style={{
                transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
                transformOrigin: "center center",
                transition: isDragging ? "none" : "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
              className="relative inline-block max-h-[560px]"
            >
              {viewMode === "annotated" && detectionResult?.annotated_image_base64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`data:image/jpeg;base64,${detectionResult.annotated_image_base64}`}
                  alt="Annotated Frame"
                  className="max-h-[560px] w-auto object-contain rounded-xl shadow-sm block pointer-events-none"
                  draggable={false}
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Source Worker"
                    className="max-h-[560px] w-auto object-contain rounded-xl block shadow-sm pointer-events-none"
                    draggable={false}
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
                        const isHovered = hoveredBox === obj || selectedObjectIdx === i;

                        const baseDim = Math.max(detectionResult.image_width, detectionResult.image_height);
                        const baseStroke = Math.max(3, Math.round(baseDim * 0.0035));
                        const strokeWidth = isHovered ? Math.round(baseStroke * 1.6) : baseStroke;
                        const fontSize = Math.max(14, Math.round(baseDim * 0.016));
                        const badgeH = Math.round(fontSize * 1.5);
                        const badgeY = Math.max(0, obj.bbox.y1 - badgeH - Math.round(baseStroke * 0.4));
                        const labelText = `${obj.label} ${Math.round(obj.confidence * 100)}%`;
                        const badgeW = Math.max(
                          Math.round(fontSize * (labelText.length * 0.62 + 1.2)),
                          Math.round(obj.bbox.width * 0.45)
                        );

                        return (
                          <g
                            key={i}
                            className="pointer-events-auto cursor-pointer"
                            onClick={() => handleFocusObject(obj, i)}
                            onMouseEnter={() => {
                              setHoveredBox(obj);
                              setSelectedObjectIdx(i);
                            }}
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
                                    ? "rgba(0, 230, 118, 0.38)"
                                    : "rgba(255, 145, 0, 0.38)"
                                  : isHelmet
                                  ? "rgba(0, 230, 118, 0.18)"
                                  : "rgba(255, 145, 0, 0.18)"
                              }
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                              rx={Math.max(3, Math.round(baseDim * 0.002))}
                            />
                            {/* High-visibility pill badge with black bold text */}
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
                </>
              )}
            </div>

            {/* Bottom-Left Image Specs & Latency */}
            {detectionResult && (
              <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[11px] text-white/80 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-sm font-technical no-drag">
                <span>
                  {detectionResult.image_width}×{detectionResult.image_height}
                </span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{detectionResult.inference_time_ms} ms</span>
              </div>
            )}

            {/* Subtle "Ctrl + Scroll to Zoom" Floating Hint (Google Maps style) */}
            {showCtrlHint && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 px-4 py-2.5 rounded-2xl bg-slate-950/90 text-white text-xs font-semibold backdrop-blur-md shadow-2xl border border-white/20 pointer-events-none transition-all flex items-center gap-2 font-technical">
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-[11px] font-bold text-amber-400 font-mono">
                  Ctrl
                </span>
                <span>+ Scroll to zoom photo</span>
              </div>
            )}

            {/* Floating Zoom & Pan Control Dock */}
            <div className="zoom-dock absolute bottom-3 right-14 z-20 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/20 shadow-lg text-xs font-technical text-white no-drag">
              <span className="text-[11px] font-technical text-white/70 flex items-center gap-1.5 border-r border-white/20 pr-2 select-none">
                <span className="px-1.5 py-0.5 rounded bg-white/15 text-white font-bold text-[9px] font-mono">
                  Ctrl
                </span>
                <span className="hidden sm:inline">+ Scroll</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  setZoomScale((prev) => {
                    const next = Math.max(1, Math.round((prev - 0.25) * 100) / 100);
                    if (next === 1) setPanPosition({ x: 0, y: 0 });
                    return next;
                  });
                }}
                disabled={zoomScale <= 1}
                className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="px-1 text-[11px] font-bold min-w-[2.8rem] text-center">
                {Math.round(zoomScale * 100)}%
              </span>

              <button
                type="button"
                onClick={() => {
                  setZoomScale((prev) => Math.min(4, Math.round((prev + 0.25) * 100) / 100));
                }}
                disabled={zoomScale >= 4}
                className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {zoomScale > 1 && (
                <button
                  type="button"
                  onClick={resetAllZoom}
                  className="ml-1 px-2 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-[10px] font-bold tracking-wider uppercase transition-colors cursor-pointer flex items-center gap-1"
                  title="Fit to screen"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Fit</span>
                </button>
              )}
            </div>

            {/* Retractable Floating Compliance Drawer */}
            {detectionResult && (
              <div
                onWheel={(e) => e.stopPropagation()}
                className={`compliance-drawer absolute top-4 bottom-4 right-4 z-20 flex transition-all duration-300 no-drag ${
                  drawerOpen ? "translate-x-0" : "translate-x-[calc(100%-2.25rem)]"
                }`}
              >
                {/* Drawer Toggle Tab */}
                <button
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="self-center bg-white hover:bg-slate-50 text-slate-900 p-2 rounded-l-xl border-y border-l border-slate-200 shadow-md flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  title={drawerOpen ? "Close Drawer" : "Open Drawer"}
                >
                  {drawerOpen ? (
                    <ChevronRight className="w-4 h-4 text-slate-700" />
                  ) : (
                    <div className="flex items-center gap-1.5 py-1">
                      <ChevronLeft className="w-4 h-4 text-slate-700" />
                      <span className="[writing-mode:vertical-rl] rotate-180 uppercase tracking-wider text-[10px] font-bold text-slate-900">
                        Audit ({detectionResult.compliance.compliance_score}%)
                      </span>
                    </div>
                  )}
                </button>

                {/* Drawer Content */}
                <div className="w-72 sm:w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-r-2xl p-5 shadow-xl flex flex-col justify-between overflow-y-auto space-y-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                          K3 Status
                        </span>
                        <div className="mt-1">
                          <ComplianceBadge status={detectionResult.compliance.status} size="md" />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold block tracking-wider">
                          SCORE
                        </span>
                        <span className="text-2xl font-extrabold text-slate-900 font-technical">
                          {detectionResult.compliance.compliance_score}%
                        </span>
                      </div>
                    </div>

                    {/* Subtabs Switcher: Summary vs Equipment List */}
                    <div className="flex rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                      <button
                        onClick={() => setDrawerTab("summary")}
                        className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          drawerTab === "summary"
                            ? "bg-white text-slate-900 shadow-2xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Summary</span>
                      </button>
                      <button
                        onClick={() => setDrawerTab("objects")}
                        className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                          drawerTab === "objects"
                            ? "bg-white text-slate-900 shadow-2xs font-bold"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <ListFilter className="w-3.5 h-3.5" />
                        <span>Units ({detectionResult.objects.length})</span>
                      </button>
                    </div>

                    {drawerTab === "summary" ? (
                      /* Summary Tab */
                      <div className="space-y-4">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {detectionResult.compliance.message}
                        </p>

                        {/* Count Boxes */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
                            <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                              <HardHat className="w-3.5 h-3.5 text-emerald-600" /> Helmets
                            </span>
                            <span className="text-xl font-extrabold text-slate-900 block mt-1 font-technical">
                              {detectionResult.compliance.helmet_count}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                            <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-amber-600" /> Vests
                            </span>
                            <span className="text-xl font-extrabold text-slate-900 block mt-1 font-technical">
                              {detectionResult.compliance.jacket_count}
                            </span>
                          </div>
                        </div>

                        {/* Recommendations */}
                        {detectionResult.compliance.recommendations.length > 0 && (
                          <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Action Items:
                            </span>
                            <ul className="space-y-1.5 text-xs text-slate-600">
                              {detectionResult.compliance.recommendations.map((rec, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-amber-500 font-bold">•</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Identified Equipment List Tab */
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        <p className="text-[11px] text-slate-400">
                          Click any detected unit to auto-focus and zoom onto the worker:
                        </p>
                        {detectionResult.objects.map((obj, idx) => {
                          const isHelmet = obj.label.toLowerCase().includes("helmet");
                          const isSelected = selectedObjectIdx === idx;

                          return (
                            <div
                              key={idx}
                              onClick={() => handleFocusObject(obj, idx)}
                              onMouseEnter={() => {
                                setHoveredBox(obj);
                                setSelectedObjectIdx(idx);
                              }}
                              onMouseLeave={() => setHoveredBox(null)}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                                isSelected
                                  ? "border-amber-500 bg-amber-50/50 shadow-2xs"
                                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                    isHelmet
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {isHelmet ? (
                                    <HardHat className="w-3.5 h-3.5" />
                                  ) : (
                                    <Shield className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold text-slate-900 block leading-tight">
                                    {obj.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-technical block">
                                    {Math.round(obj.bbox.width)}×{Math.round(obj.bbox.height)} px
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-900 font-technical">
                                  {Math.round(obj.confidence * 100)}%
                                </span>
                                <Crosshair
                                  className={`w-3.5 h-3.5 transition-transform ${
                                    isSelected ? "text-amber-600 scale-125" : "text-slate-400"
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={handleSaveAudit}
                      disabled={isSaving || saveSuccess}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                        saveSuccess
                          ? "bg-emerald-600 text-white cursor-default"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      {saveSuccess ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-200" />
                          <span>Saved to Audit Log</span>
                        </>
                      ) : isSaving ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-amber-400" />
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
