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
  Maximize2,
  Minimize2,
  Pencil,
  RefreshCw,
  AlertTriangle,
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

  // Edit Modal State
  const [editingCamera, setEditingCamera] = useState<CameraItem | null>(null);
  const [editCamName, setEditCamName] = useState<string>("");
  const [editCamType, setEditCamType] = useState<"DEVICE" | "RTSP">("RTSP");
  const [editCamLocation, setEditCamLocation] = useState<string>("");
  const [editCamUrl, setEditCamUrl] = useState<string>("");
  const [isEditingCam, setIsEditingCam] = useState<boolean>(false);

  // Delete Camera Modal State
  const [camToDelete, setCamToDelete] = useState<CameraItem | null>(null);
  const [isDeletingCam, setIsDeletingCam] = useState<boolean>(false);

  // Refs for Device Webcam
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastDetectionsRef = useRef<DetectedObject[]>([]);
  const targetFpsRef = useRef<number>(10);
  targetFpsRef.current = targetFps;

  // Fullscreen State & Ref
  const masterStageRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!masterStageRef.current) return;
    if (!document.fullscreenElement) {
      masterStageRef.current.requestFullscreen().catch((err) => {
        console.error("Fullscreen request failed:", err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Exit fullscreen failed:", err);
      });
    }
  };

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

  // Lock body scrolling when camera modals are open
  useEffect(() => {
    if (showAddModal || editingCamera || camToDelete) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAddModal, editingCamera, camToDelete]);

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

  // Open edit modal
  const handleOpenEditModal = (cam: CameraItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCamera(cam);
    setEditCamName(cam.name);
    setEditCamType(cam.type);
    setEditCamLocation(cam.location || "Sector A - Main Gate");
    setEditCamUrl(cam.url || "");
  };

  // Save edited camera handler
  const handleSaveEditCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCamera) return;
    if (!editCamName.trim()) return;
    if (editCamType === "RTSP" && !editCamUrl.trim()) return;

    setIsEditingCam(true);
    try {
      const res = await fetch("/api/cameras", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCamera.id,
          name: editCamName.trim(),
          type: editCamType,
          url: editCamType === "RTSP" ? editCamUrl.trim() : null,
          location: editCamLocation.trim() || "Main Jobsite Area",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCameras((prev) => prev.map((c) => (c.id === json.data.id ? json.data : c)));
        if (activeCamera?.id === json.data.id) {
          setActiveCamera(json.data);
        }
        setEditingCamera(null);
      } else {
        alert(json.error || "Failed to update camera.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update camera.");
    } finally {
      setIsEditingCam(false);
    }
  };

  // Confirm delete camera handler
  const confirmDeleteCamera = async () => {
    if (!camToDelete) return;
    setIsDeletingCam(true);
    try {
      const res = await fetch(`/api/cameras?id=${camToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setCameras((prev) => prev.filter((c) => c.id !== camToDelete.id));
        if (activeCamera?.id === camToDelete.id) {
          stopCurrentStream();
        }
        setCamToDelete(null);
      } else {
        throw new Error("Failed to delete camera channel.");
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete camera.");
    } finally {
      setIsDeletingCam(false);
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
      {/* Top Stream Configuration Bar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0E1626] px-5 py-3 shadow-sm dark:shadow-md flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div className="flex flex-wrap items-center gap-5 text-xs">
          {/* Confidence Slider */}
          <div className="flex items-center gap-2.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" /> Threshold:
            </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {Math.round(confidence * 100)}%
            </span>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={confidence}
              onChange={(e) => setConfidence(parseFloat(e.target.value))}
              className="w-20 sm:w-24 accent-[#2563EB] cursor-pointer"
            />
          </div>

          {/* Target FPS Slider Setting */}
          <div className="flex items-center gap-2.5 border-l border-slate-200 dark:border-slate-700/60 pl-4 font-mono">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" /> Target FPS:
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {targetFps} FPS
            </span>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={targetFps}
              onChange={(e) => handleFpsChange(parseInt(e.target.value, 10))}
              className="w-20 sm:w-24 accent-[#2563EB] cursor-pointer"
            />
          </div>
        </div>

        {/* Class Filter Tabs */}
        {isActive && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700/60 text-xs font-semibold">
            <button
              onClick={() => setClassFilter("all")}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                classFilter === "all"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setClassFilter("helmet")}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                classFilter === "helmet"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <HardHat className="w-3 h-3 text-[#2563EB] dark:text-[#3B82F6]" /> Helmets
            </button>
            <button
              onClick={() => setClassFilter("vest")}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                classFilter === "vest"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Shield className="w-3 h-3 text-[#60A5FA]" /> Vests
            </button>
          </div>
        )}

        {/* Stream Actions */}
        <div className="flex items-center gap-2">
          {isActive ? (
            <>
              <button
                onClick={handleCaptureSnapshot}
                className="px-4 py-2 rounded-lg btn-caldera-primary text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {snapshotSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Saved</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Take Snapshot</span>
                  </>
                )}
              </button>

              <button
                onClick={toggleFullscreen}
                className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen CCTV Monitor"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
              </button>

              <button
                onClick={stopCurrentStream}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>Stop Stream</span>
              </button>
            </>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span>STANDBY — SELECT CAMERA BELOW</span>
            </div>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Master Focus Stage Viewport (1-Active-Camera, Supports Fullscreen) */}
      <div
        ref={masterStageRef}
        className={
          isFullscreen
            ? "fixed inset-0 z-50 w-screen h-screen max-h-none rounded-none border-0 bg-black flex items-center justify-center overflow-hidden select-none"
            : "relative aspect-video max-h-[560px] mx-auto w-full rounded-xl overflow-hidden bg-slate-100/90 dark:bg-[#08080C] border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-sm dark:shadow-xl tactical-viewport transition-colors"
        }
      >
        {/* Viewport Top-Right Fullscreen Toggle Pill */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 z-30 p-2 rounded-lg bg-white/90 dark:bg-[#0E1626]/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700/80 backdrop-blur-xl shadow-sm transition-all cursor-pointer"
          title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen Monitor"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Fullscreen K3 Violation Alert Banner */}
        {isFullscreen && lastCompliance?.status === "NON_COMPLIANT" && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600/95 backdrop-blur-md text-white text-xs font-bold shadow-2xl border border-rose-400 animate-pulse font-mono">
            <AlertCircle className="w-4 h-4 text-white" />
            <span>K3 VIOLATION: Personnel detected missing required PPE equipment</span>
          </div>
        )}
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
              <div className="text-center text-xs text-slate-500 dark:text-slate-400 space-y-2 font-mono">
                <Radio className="w-8 h-8 text-[#2563EB] dark:text-[#3B82F6] animate-pulse mx-auto" />
                <p>Connecting to RTSP stream feed: {activeCamera.name}...</p>
              </div>
            )}
          </div>
        )}

        {/* Standby Viewport Display */}
        {!isActive && (
          <div className="text-center p-8 space-y-3">
            <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 flex items-center justify-center mx-auto shadow-sm transition-colors">
              <Tv className="w-6 h-6 text-[#2563EB] dark:text-[#3B82F6]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-display transition-colors">
                CCTV Surveillance Monitor Standby
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed transition-colors">
                {cameras.length > 0
                  ? "Click 'Activate on Stage' on any registered camera card in the CCTV Control Deck below to begin real-time PPE audit monitoring."
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 bg-white/95 dark:bg-[#0E1626]/95 backdrop-blur-xl text-slate-900 dark:text-white border border-emerald-500/40 px-6 py-4 rounded-xl shadow-xl flex flex-col items-center gap-2 pointer-events-none animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-inner">
              <Check className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Snapshot Saved!</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">Audit frame recorded to database logbook.</p>
            </div>
          </div>
        )}

        {/* Floating HUD */}
        {isActive && activeCamera && (
          <div className="absolute top-3 left-3 flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-slate-900/90 dark:bg-[#0E1626]/90 backdrop-blur-xl text-xs font-medium text-white pointer-events-auto shadow-md border border-slate-700/80 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold uppercase tracking-wider text-[11px] text-emerald-400">
              LIVE
            </span>
            <span className="text-white/30">|</span>
            <span className="font-semibold text-white">{activeCamera.name}</span>
            <span className="text-white/30">|</span>
            <span className="text-[11px] text-slate-400">{activeCamera.location}</span>
            <span className="text-white/30">|</span>
            <span className="text-slate-300">{streamStats.fps} FPS</span>
            <span className="text-white/30">|</span>
            <span className="text-slate-300">{streamStats.latency} ms</span>
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
              className="self-center bg-white dark:bg-[#0E1626] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white p-2 rounded-l-lg border-y border-l border-slate-200 dark:border-slate-700/80 shadow-md flex items-center gap-1 text-xs font-semibold transition-colors"
              title={drawerOpen ? "Close Drawer" : "Open Drawer"}
            >
              {drawerOpen ? (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              ) : (
                <div className="flex items-center gap-1.5 py-1">
                  <ChevronLeft className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
                  <span className="[writing-mode:vertical-rl] rotate-180 uppercase tracking-wider text-[10px] font-mono font-bold text-slate-900 dark:text-white">
                    Live ({lastCompliance.compliance_score}%)
                  </span>
                </div>
              )}
            </button>

            <div className="w-72 sm:w-80 bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-700/80 rounded-r-xl p-5 shadow-xl flex flex-col justify-between space-y-4 text-slate-900 dark:text-white transition-colors">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">
                    Safety Status
                  </span>
                  <span className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                    {lastCompliance.compliance_score}%
                  </span>
                </div>

                <ComplianceBadge status={lastCompliance.status} size="md" />

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                  {lastCompliance.message}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <HardHat className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" /> Helmets
                    </span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white block mt-1 font-mono">
                      {lastCompliance.helmet_count}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-[#60A5FA]" /> Vests
                    </span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white block mt-1 font-mono">
                      {lastCompliance.jacket_count}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Viewport Top Right HUD Stats */}
        {isActive && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/95 dark:bg-[#0E0E14]/95 text-[11px] font-mono text-slate-600 dark:text-gray-300 pointer-events-auto border border-slate-200 dark:border-white/10 shadow-md">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <HardHat className="w-3 h-3" />
              {lastCompliance?.helmet_count ?? 0}
            </span>
            <span className="text-gray-400">•</span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
              <Shield className="w-3 h-3" />
              {lastCompliance?.jacket_count ?? 0}
            </span>
          </div>
        )}
      </div>

      {/* Camera Carousel / Multi-Camera Filmstrip Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono transition-colors">
              Registered Camera Feeds ({cameras.length})
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              • CLICK TO ACTIVATE
            </span>
          </div>
        </div>

        {isLoadingCameras ? (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-mono">
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
                  className={`group relative p-4 rounded-xl border transition-all cursor-pointer bg-white dark:bg-[#0E1626] shadow-sm dark:shadow-md flex flex-col justify-between space-y-3 ${
                    isCurrentActive
                      ? "border-emerald-500 ring-1 ring-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-500/5"
                      : "border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          isCurrentActive
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-white"
                        }`}
                      >
                        {isDevice ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <Radio className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 transition-colors">
                          {cam.name}
                        </h4>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 transition-colors">
                          {cam.location || "General Area"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isDevice
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {cam.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs transition-colors">
                    {isCurrentActive ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        STREAMING
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white flex items-center gap-1 font-medium transition-colors">
                        <Play className="w-3 h-3 text-[#2563EB] dark:text-[#3B82F6]" />
                        Activate on Stage
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleOpenEditModal(cam, e)}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Camera Configuration"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCamToDelete(cam);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete Camera"
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
              className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700/80 hover:border-[#2563EB]/60 dark:hover:border-[#3B82F6]/60 bg-slate-50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 min-h-[120px] group shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-[#2563EB] dark:group-hover:text-[#3B82F6] group-hover:border-[#2563EB]/40 dark:group-hover:border-[#3B82F6]/40 transition-colors">
                <Plus className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                + Register New Camera
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Camera Modal */}
      {showAddModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingCam) setShowAddModal(false);
          }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print"
        >
          <div className="bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Register New Camera
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add local webcam or network RTSP/IP CCTV camera
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={isSavingCam}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCamera} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 font-mono">
                  Camera / Feed Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CCTV Gate 1 - North Entrance"
                  value={newCamName}
                  onChange={(e) => setNewCamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-slate-900 dark:text-white text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 font-mono">
                  Feed Architecture
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCamType("RTSP")}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newCamType === "RTSP"
                        ? "border-[#2563EB] dark:border-[#3B82F6] bg-[#2563EB]/10 dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-white shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>IP / RTSP CCTV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCamType("DEVICE")}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      newCamType === "DEVICE"
                        ? "border-[#2563EB] dark:border-[#3B82F6] bg-[#2563EB]/10 dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-white shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Local USB / Cam</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 font-mono">
                  Jobsite Location / Sector
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sector B - Heavy Equipment Zone"
                  value={newCamLocation}
                  onChange={(e) => setNewCamLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-slate-900 dark:text-white text-xs transition-colors"
                />
              </div>

              {newCamType === "RTSP" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      RTSP Stream URL
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setNewCamUrl("rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4")
                      }
                      className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] hover:underline font-semibold"
                    >
                      Use Demo Stream
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="rtsp://username:password@ip:554/stream"
                    value={newCamUrl}
                    onChange={(e) => setNewCamUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-slate-900 dark:text-white text-xs font-mono transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    Supported: RTSP URLs (`rtsp://`), public CCTV IP streams, or direct network MP4 feeds.
                  </p>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSavingCam}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCam || !newCamName.trim()}
                  className="px-5 py-2 rounded-lg btn-caldera-primary text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isSavingCam ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Camera...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Camera</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Camera Modal */}
      {editingCamera && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isEditingCam) setEditingCamera(null);
          }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print"
        >
          <div className="bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6]">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    Edit Camera Channel
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Modify stream URL, channel name, or location
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCamera(null)}
                disabled={isEditingCam}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCamera} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 font-mono">
                  Camera / Feed Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scaffolding Gate 02"
                  value={editCamName}
                  onChange={(e) => setEditCamName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-slate-900 dark:text-white text-xs transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 font-mono">
                  Feed Architecture
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditCamType("RTSP")}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editCamType === "RTSP"
                        ? "border-[#2563EB] dark:border-[#3B82F6] bg-[#2563EB]/10 dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-white shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>IP / RTSP CCTV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditCamType("DEVICE")}
                    className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editCamType === "DEVICE"
                        ? "border-[#2563EB] dark:border-[#3B82F6] bg-[#2563EB]/10 dark:bg-[#2563EB]/20 text-[#2563EB] dark:text-white shadow-xs"
                        : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Local USB / Cam</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 font-mono">
                  Jobsite Location / Sector
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sector B - Tower Crane Area"
                  value={editCamLocation}
                  onChange={(e) => setEditCamLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-slate-900 dark:text-white text-xs transition-colors"
                />
              </div>

              {editCamType === "RTSP" && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 font-mono">
                      RTSP Stream URL
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setEditCamUrl("rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4")
                      }
                      className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] hover:underline font-semibold"
                    >
                      Use Demo Stream
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="rtsp://username:password@ip:554/stream"
                    value={editCamUrl}
                    onChange={(e) => setEditCamUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 focus:outline-none focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-slate-900 dark:text-white text-xs font-mono transition-colors"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    Format: rtsp://[user]:[password]@[ip]:[port]/[path]
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCamera(null)}
                  disabled={isEditingCam}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditingCam || !editCamName.trim()}
                  className="px-5 py-2 rounded-lg btn-caldera-primary text-white font-semibold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isEditingCam ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Camera Confirmation Modal */}
      {camToDelete && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeletingCam) setCamToDelete(null);
          }}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto no-print"
        >
          <div className="bg-white dark:bg-[#0E1626] border border-slate-200 dark:border-slate-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white transition-colors">
            <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight font-display">
                Delete Camera Channel?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Are you sure you want to remove{" "}
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {camToDelete.name}
                </span>{" "}
                from your registered CCTV channels?
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 text-xs font-semibold pt-2">
              <button
                type="button"
                onClick={() => setCamToDelete(null)}
                disabled={isDeletingCam}
                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCamera}
                disabled={isDeletingCam}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm font-semibold uppercase tracking-wider"
              >
                {isDeletingCam ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Channel</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
