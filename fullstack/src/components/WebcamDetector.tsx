"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  CameraOff,
  Video,
  Radio,
  Sliders,
  Check,
  Sparkles,
  HardHat,
  Shield,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Plus,
  Trash2,
  Tv,
  X,
  Play,
  Layers,
  Gauge,
} from "lucide-react";
import { StreamFrameResponse, DetectedObject, CameraItem } from "@/types";
import { createStreamWebSocket, createRTSPWebSocket } from "@/lib/ai-client";
import ComplianceBadge from "./ComplianceBadge";

export default function WebcamDetector() {
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [activeCamera, setActiveCamera] = useState<CameraItem | null>(null);
  const [isLoadingCameras, setIsLoadingCameras] = useState<boolean>(true);

  // Streaming State
  const [isActive, setIsActive] = useState<boolean>(false);
  const [confidence, setConfidence] = useState<number>(0.65);
  const [targetFps, setTargetFps] = useState<number>(10);
  const [streamStats, setStreamStats] = useState<{ fps: number; latency: number }>({ fps: 0, latency: 0 });
  const [lastCompliance, setLastCompliance] = useState<StreamFrameResponse["compliance"] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [snapshotSaved, setSnapshotSaved] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [rtspFrameBase64, setRtspFrameBase64] = useState<string | null>(null);

  // Filters & Drawer
  const [classFilter, setClassFilter] = useState<"all" | "helmet" | "vest">("all");
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newCamName, setNewCamName] = useState<string>("");
  const [newCamType, setNewCamType] = useState<"DEVICE" | "RTSP">("RTSP");
  const [newCamLocation, setNewCamLocation] = useState<string>("Sector A - Main Gate");
  const [newCamUrl, setNewCamUrl] = useState<string>("");
  const [isSavingCam, setIsSavingCam] = useState<boolean>(false);

  // Refs for Device Webcam
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectionsRef = useRef<DetectedObject[]>([]);
  const targetFpsRef = useRef<number>(10);

  targetFpsRef.current = targetFps;

  // Fetch registered cameras from project database
  const fetchCameras = useCallback(async () => {
    try {
      const res = await fetch("/api/cameras");
      const json = await res.json();
      if (json.success) {
        setCameras(json.data || []);
      }
    } catch (e) {
      console.error("Failed to load camera list:", e);
    } finally {
      setIsLoadingCameras(false);
    }
  }, []);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  // Canvas drawer for Bounding Boxes (for Webcam & RTSP)
  const drawBoxes = useCallback(
    (objects: DetectedObject[], sourceWidth: number = 640, sourceHeight: number = 480) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = sourceWidth;
      canvas.height = sourceHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const filteredObjects = objects.filter((obj) => {
        if (classFilter === "all") return true;
        const isHelmet = obj.label.toLowerCase().includes("helmet");
        if (classFilter === "helmet") return isHelmet;
        if (classFilter === "vest") return !isHelmet;
        return true;
      });

      filteredObjects.forEach((obj) => {
        const isHelmet = obj.label.toLowerCase().includes("helmet");
        const strokeColor = isHelmet ? "#00e676" : "#ff9100";
        const fillColor = isHelmet ? "rgba(0, 230, 118, 0.20)" : "rgba(255, 145, 0, 0.20)";

        const x = obj.bbox.norm_x1 * canvas.width;
        const y = obj.bbox.norm_y1 * canvas.height;
        const w = (obj.bbox.norm_x2 - obj.bbox.norm_x1) * canvas.width;
        const h = (obj.bbox.norm_y2 - obj.bbox.norm_y1) * canvas.height;

        // Dark contrast drop shadow for maximum visibility
        ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3.5;
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 5);
        ctx.fill();
        ctx.stroke();

        // Label Pill
        const labelText = `${obj.label} ${Math.round(obj.confidence * 100)}%`;
        ctx.font = "bold 12px sans-serif";
        const textWidth = ctx.measureText(labelText).width;
        const badgeH = 22;
        const badgeY = Math.max(0, y - badgeH - 2);

        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.roundRect(x, badgeY, textWidth + 14, badgeH, 4);
        ctx.fill();

        // Reset shadow for crisp text
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#000000";
        ctx.font = "900 11px sans-serif";
        ctx.fillText(labelText, x + 7, badgeY + 15);
      });
    },
    [classFilter]
  );

  // Stop currently active camera stream (Device or RTSP)
  const stopCurrentStream = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ action: "stop" }));
        } catch {
          // ignore
        }
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setActiveCamera(null);
    setRtspFrameBase64(null);
    setLastCompliance(null);
    setStreamStats({ fps: 0, latency: 0 });
  }, []);

  // Frame sender runner for Device Webcam
  const setupDeviceInterval = useCallback((fps: number) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const delay = Math.max(30, Math.round(1000 / Math.max(1, fps)));
    intervalRef.current = setInterval(() => {
      if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }
      const video = videoRef.current;
      if (video.readyState < 2) return;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 640;
      tempCanvas.height = 480;
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, 640, 480);
      const base64Data = tempCanvas.toDataURL("image/jpeg", 0.65);
      wsRef.current.send(
        JSON.stringify({
          image: base64Data,
          confidence: confidence,
        })
      );
    }, delay);
  }, [confidence]);

  // Handle dynamic FPS change
  const handleFpsChange = (newFps: number) => {
    setTargetFps(newFps);
    if (isActive && activeCamera?.type === "DEVICE") {
      setupDeviceInterval(newFps);
    } else if (isActive && activeCamera?.type === "RTSP" && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          action: "set_fps",
          fps: newFps,
        })
      );
    }
  };

  // Start Device Webcam Stream
  const startDeviceStream = useCallback(async (cam: CameraItem) => {
    stopCurrentStream();
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      const ws = createStreamWebSocket(
        (data: unknown) => {
          const resp = data as StreamFrameResponse;
          if (resp && resp.status === "success") {
            setStreamStats({
              fps: resp.fps || 0,
              latency: resp.inference_time_ms || 0,
            });
            setLastCompliance(resp.compliance);
            lastDetectionsRef.current = resp.objects;
            drawBoxes(resp.objects, 640, 480);
          }
        },
        () => {
          setErrorMsg("WebSocket connection to AI Engine failed.");
        }
      );

      wsRef.current = ws;
      setActiveCamera(cam);
      setIsActive(true);

      setupDeviceInterval(targetFpsRef.current);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to access camera.";
      setErrorMsg(`Camera error: ${msg}`);
      stopCurrentStream();
    }
  }, [drawBoxes, setupDeviceInterval, stopCurrentStream]);

  // Start RTSP Camera Stream
  const startRTSPStream = useCallback((cam: CameraItem) => {
    stopCurrentStream();
    setErrorMsg(null);

    if (!cam.url) {
      setErrorMsg("RTSP URL is empty.");
      return;
    }

    try {
      const ws = createRTSPWebSocket(
        (data: unknown) => {
          const resp = data as StreamFrameResponse;
          if (resp.status === "error") {
            setErrorMsg((data as { message: string }).message || "RTSP streaming error.");
            return;
          }
          if (resp.status === "connected") {
            setIsActive(true);
            return;
          }
          if (resp.status === "success") {
            setStreamStats({
              fps: resp.fps || 0,
              latency: resp.inference_time_ms || 0,
            });
            setLastCompliance(resp.compliance);
            lastDetectionsRef.current = resp.objects;
            if (resp.frame_base64) {
              setRtspFrameBase64(resp.frame_base64);
            }
          }
        },
        () => {
          setErrorMsg("WebSocket connection to RTSP gateway failed.");
        }
      );

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            action: "start",
            rtsp_url: cam.url,
            confidence: confidence,
            fps: targetFpsRef.current,
          })
        );
      };

      wsRef.current = ws;
      setActiveCamera(cam);
      setIsActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect to RTSP.";
      setErrorMsg(`RTSP error: ${msg}`);
      stopCurrentStream();
    }
  }, [confidence, stopCurrentStream]);

  // Switch camera activation
  const handleActivateCamera = (cam: CameraItem) => {
    if (activeCamera?.id === cam.id && isActive) {
      stopCurrentStream();
    } else {
      if (cam.type === "DEVICE") {
        startDeviceStream(cam);
      } else {
        startRTSPStream(cam);
      }
    }
  };

  // Add new camera handler
  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamName.trim()) return;
    if (newCamType === "RTSP" && !newCamUrl.trim()) return;

    setIsSavingCam(true);
    try {
      const res = await fetch("/api/cameras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCamName.trim(),
          type: newCamType,
          url: newCamType === "RTSP" ? newCamUrl.trim() : null,
          location: newCamLocation.trim() || "Main Jobsite Area",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCameras((prev) => [...prev, json.data]);
        setShowAddModal(false);
        setNewCamName("");
        setNewCamUrl("");
      } else {
        alert(json.error || "Failed to add camera.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to add camera.");
    } finally {
      setIsSavingCam(false);
    }
  };

  // Delete camera handler
  const handleDeleteCamera = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete camera "${name}" from project database?`)) return;

    try {
      const res = await fetch(`/api/cameras?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCameras((prev) => prev.filter((c) => c.id !== id));
        if (activeCamera?.id === id) {
          stopCurrentStream();
        }
      }
    } catch {
      alert("Failed to delete camera.");
    }
  };

  // Snapshot capture handler
  const handleCaptureSnapshot = async () => {
    if (!lastCompliance) return;

    // Trigger visual camera shutter flash animation
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    let snapBase64 = "";

    if (activeCamera?.type === "DEVICE" && videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(videoRef.current, 0, 0);
      snapBase64 = canvas.toDataURL("image/jpeg", 0.85);
    } else if (activeCamera?.type === "RTSP" && rtspFrameBase64) {
      snapBase64 = `data:image/jpeg;base64,${rtspFrameBase64}`;
    }

    if (!snapBase64) return;

    try {
      const payload = {
        source: activeCamera?.type === "DEVICE" ? "WEBCAM" : "RTSP",
        fileName: `${activeCamera?.name || "LiveStream"}_${Date.now()}.jpg`,
        annotatedImageBase64: snapBase64,
        complianceStatus: lastCompliance.status,
        complianceScore: lastCompliance.compliance_score,
        helmetCount: lastCompliance.helmet_count,
        jacketCount: lastCompliance.jacket_count,
        totalDetected: lastCompliance.total_detected,
        inferenceMs: streamStats.latency,
        objects: lastDetectionsRef.current,
      };

      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save snapshot.");
      setSnapshotSaved(true);
      setTimeout(() => setSnapshotSaved(false), 2500);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to save snapshot.");
    }
  };

  useEffect(() => {
    return () => {
      stopCurrentStream();
    };
  }, [stopCurrentStream]);

  return (
    <div className="space-y-6">
      {/* Top Controls Toolbar with Dynamic FPS & Confidence */}
      <div className="rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5 text-xs">
          {/* Confidence Slider */}
          <div className="flex items-center gap-2.5">
            <span className="text-gray-500 font-medium flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-amber-500" /> Threshold:
            </span>
            <span className="font-semibold text-gray-800 font-mono">
              {Math.round(confidence * 100)}%
            </span>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="w-20 sm:w-24 accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Target FPS Slider Setting */}
          <div className="flex items-center gap-2.5 border-l border-gray-200 pl-4">
            <span className="text-gray-500 font-medium flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-[#0a1b5c]" /> Target FPS:
            </span>
            <span className="font-semibold text-[#0a1b5c] font-mono">
              {targetFps} FPS
            </span>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={targetFps}
              onChange={(e) => handleFpsChange(parseInt(e.target.value, 10))}
              className="w-20 sm:w-24 accent-[#0a1b5c] cursor-pointer"
            />
          </div>
        </div>

        {/* Class Filter Tabs */}
        {isActive && (
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-md border border-gray-200 text-xs">
            <button
              onClick={() => setClassFilter("all")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                classFilter === "all"
                  ? "bg-white text-[#0a1b5c] shadow-2xs font-semibold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setClassFilter("helmet")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                classFilter === "helmet"
                  ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                  : "text-gray-600 hover:text-emerald-700"
              }`}
            >
              <HardHat className="w-3 h-3 text-emerald-600" /> Helmets
            </button>
            <button
              onClick={() => setClassFilter("vest")}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                classFilter === "vest"
                  ? "bg-white text-amber-700 shadow-2xs font-semibold"
                  : "text-gray-600 hover:text-amber-700"
              }`}
            >
              <Shield className="w-3 h-3 text-amber-600" /> Vests
            </button>
          </div>
        )}

        {/* Stream Actions */}
        <div className="flex items-center gap-2">
          {isActive ? (
            <>
              <button
                onClick={handleCaptureSnapshot}
                className="px-3.5 py-1.5 rounded-md bg-[#0a1b5c] hover:bg-[#0a1b5c]/90 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {snapshotSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Take Snapshot</span>
                  </>
                )}
              </button>

              <button
                onClick={stopCurrentStream}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>Stop Stream</span>
              </button>
            </>
          ) : (
            <div className="text-xs text-gray-500 flex items-center gap-2 font-medium">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span>Standby — Select a camera below</span>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Master Focus Stage Viewport (1-Active-Camera) */}
      <div className="relative aspect-video max-h-[560px] mx-auto w-full rounded-2xl overflow-hidden bg-slate-950 border border-gray-200 flex items-center justify-center shadow-sm">
        {/* Device Webcam Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            isActive && activeCamera?.type === "DEVICE" ? "block" : "hidden"
          }`}
        />

        {/* Overlay Canvas for Bounding Boxes */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${
            isActive && activeCamera?.type === "DEVICE" ? "block" : "hidden"
          }`}
        />

        {/* RTSP Stream Image Element */}
        {isActive && activeCamera?.type === "RTSP" && (
          <div className="relative w-full h-full flex items-center justify-center">
            {rtspFrameBase64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`data:image/jpeg;base64,${rtspFrameBase64}`}
                alt="RTSP Stream"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center text-xs text-slate-400 space-y-2">
                <Radio className="w-8 h-8 text-amber-500 animate-pulse mx-auto" />
                <p>Connecting to RTSP stream feed: {activeCamera.name}...</p>
              </div>
            )}
          </div>
        )}

        {/* Standby Viewport Display */}
        {!isActive && (
          <div className="text-center p-8 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50/10 border border-white/10 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <Tv className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                CCTV Surveillance Monitor Standby
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                {cameras.length > 0
                  ? "Click 'Activate' on any registered camera card in the CCTV Control Deck below to begin real-time PPE audit monitoring."
                  : "No cameras registered yet. Click '+ Register New Camera' below to connect your local webcam or an RTSP CCTV stream."}
              </p>
            </div>
          </div>
        )}

        {/* Camera Shutter Flash Animation */}
        <div
          className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-200 z-30 ${
            isFlashing ? "opacity-90" : "opacity-0"
          }`}
        />

        {/* Snapshot Saved Feedback Banner */}
        {snapshotSaved && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-slate-950/90 backdrop-blur-md text-white border border-emerald-500/50 px-6 py-4 rounded-2xl shadow-2xl flex flex-col items-center gap-2 pointer-events-none animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-inner">
              <Check className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-sm text-white">Snapshot Saved!</h4>
              <p className="text-[11px] text-gray-300 mt-0.5">Audit frame recorded to database logbook.</p>
            </div>
          </div>
        )}

        {/* Floating HUD */}
        {isActive && activeCamera && (
          <div className="absolute top-3 left-3 flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md text-xs font-medium text-white pointer-events-auto shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-400">
              LIVE
            </span>
            <span className="text-white/40">|</span>
            <span className="font-semibold text-white">{activeCamera.name}</span>
            <span className="text-white/40">|</span>
            <span className="text-[11px] text-slate-300">{activeCamera.location}</span>
            <span className="text-white/40">|</span>
            <span className="text-white/70">{streamStats.fps} FPS</span>
            <span className="text-white/40">|</span>
            <span className="text-amber-400 font-mono">{streamStats.latency} ms</span>
          </div>
        )}

        {/* Retractable Floating Drawer */}
        {isActive && lastCompliance && (
          <div
            className={`absolute top-4 bottom-4 right-4 z-20 flex transition-all duration-300 ${
              drawerOpen ? "translate-x-0" : "translate-x-[calc(100%-2.25rem)]"
            }`}
          >
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
                    Live ({lastCompliance.compliance_score}%)
                  </span>
                </div>
              )}
            </button>

            <div className="w-72 bg-white/95 backdrop-blur-md border border-gray-200 rounded-r-xl p-5 shadow-xl flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Safety Status
                  </span>
                  <span className="font-mono text-lg font-bold text-[#0a1b5c]">
                    {lastCompliance.compliance_score}%
                  </span>
                </div>

                <ComplianceBadge status={lastCompliance.status} size="md" />

                <p className="text-xs text-gray-600 leading-snug">
                  {lastCompliance.message}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1">
                      <HardHat className="w-3 h-3" /> Helmets
                    </span>
                    <span className="text-base font-bold text-gray-900 block mt-0.5">
                      {lastCompliance.helmet_count}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                    <span className="text-[10px] font-semibold text-amber-800 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Vests
                    </span>
                    <span className="text-base font-bold text-gray-900 block mt-0.5">
                      {lastCompliance.jacket_count}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCaptureSnapshot}
                disabled={snapshotSaved}
                className={`w-full py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all ${
                  snapshotSaved
                    ? "bg-emerald-600 text-white cursor-default"
                    : "bg-[#0a1b5c] hover:bg-[#0a1b5c]/90 text-white"
                }`}
              >
                {snapshotSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Saved to Audit Log</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Save Current Frame</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CCTV Control Deck (Filmstrip & Channel Management) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#0a1b5c]" />
          <h3 className="text-sm font-bold text-gray-900">
            CCTV Control Deck — Registered Channels ({cameras.length})
          </h3>
        </div>

        {isLoadingCameras ? (
          <div className="py-8 text-center text-xs text-gray-400">
            Loading camera channels...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {cameras.map((cam) => {
              const isCurrentActive = activeCamera?.id === cam.id && isActive;
              const isDevice = cam.type === "DEVICE";

              return (
                <div
                  key={cam.id}
                  onClick={() => handleActivateCamera(cam)}
                  className={`group relative p-4 rounded-xl border transition-all cursor-pointer bg-white shadow-2xs flex flex-col justify-between space-y-3 ${
                    isCurrentActive
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          isCurrentActive
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-blue-50 text-[#0a1b5c]"
                        }`}
                      >
                        {isDevice ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <Radio className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 group-hover:text-[#0a1b5c] line-clamp-1">
                          {cam.name}
                        </h4>
                        <span className="text-[11px] text-gray-400 line-clamp-1">
                          {cam.location || "General Area"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isDevice
                          ? "bg-purple-100 text-purple-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {cam.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                    {isCurrentActive ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        STREAMING
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-500 group-hover:text-gray-900 flex items-center gap-1 font-medium">
                        <Play className="w-3 h-3 text-amber-500" />
                        Activate on Stage
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDeleteCamera(cam.id, cam.name, e)}
                        className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete camera"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* + Register New Camera Card */}
            <div
              onClick={() => setShowAddModal(true)}
              className="p-4 rounded-xl border border-dashed border-gray-300 hover:border-[#0a1b5c] bg-gray-50/60 hover:bg-white transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 min-h-[110px]"
            >
              <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 group-hover:text-[#0a1b5c]">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-gray-700">
                + Register New Camera
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Camera Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Register New Camera
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Add local webcam or network RTSP/IP CCTV camera
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCamera} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Camera Name:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CCTV Gate 1 - North Entrance"
                  value={newCamName}
                  onChange={(e) => setNewCamName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-xs focus:ring-1 focus:ring-[#0a1b5c] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Camera Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCamType("RTSP")}
                    className={`py-2 px-3 rounded-md text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                      newCamType === "RTSP"
                        ? "border-[#0a1b5c] bg-[#0a1b5c] text-white shadow-xs"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>RTSP / IP Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCamType("DEVICE")}
                    className={`py-2 px-3 rounded-md text-xs font-semibold border transition-all flex items-center justify-center gap-2 ${
                      newCamType === "DEVICE"
                        ? "border-[#0a1b5c] bg-[#0a1b5c] text-white shadow-xs"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Device Webcam</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Jobsite Location / Sector:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sector B - Heavy Equipment Zone"
                  value={newCamLocation}
                  onChange={(e) => setNewCamLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 text-xs focus:ring-1 focus:ring-[#0a1b5c] focus:outline-none"
                />
              </div>

              {newCamType === "RTSP" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-gray-700 font-semibold">
                      RTSP Stream URL:
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewCamUrl("rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4")}
                      className="text-[11px] text-[#0a1b5c] hover:underline font-medium"
                    >
                      Use Demo Sample URL
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="rtsp://username:password@ip:554/stream"
                    value={newCamUrl}
                    onChange={(e) => setNewCamUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 text-xs font-mono focus:ring-1 focus:ring-[#0a1b5c] focus:outline-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Supported: RTSP URLs (`rtsp://`), public CCTV IP streams, or direct network MP4 feeds.
                  </p>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCam}
                  className="px-4 py-1.5 rounded-md bg-[#0a1b5c] hover:bg-[#0d327f] text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSavingCam ? "Saving..." : "Save Camera"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
