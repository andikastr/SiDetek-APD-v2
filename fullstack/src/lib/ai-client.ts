import { DetectionResponse } from "@/types";

const AI_URL = (process.env.NEXT_PUBLIC_AI_ENGINE_URL || "http://localhost:8100").replace(/\/+$/, "");

function getWebSocketUrl(path: string, envOverride?: string): string {
  if (envOverride) return envOverride;
  const isSecure = AI_URL.startsWith("https://");
  const host = AI_URL.replace(/^https?:\/\//, "");
  const wsProtocol = isSecure ? "wss://" : "ws://";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${wsProtocol}${host}${cleanPath}`;
}

const WS_URL = getWebSocketUrl("/api/v1/ws/stream", process.env.NEXT_PUBLIC_AI_ENGINE_WS_URL);
const RTSP_WS_URL = getWebSocketUrl("/api/v1/ws/rtsp", process.env.NEXT_PUBLIC_AI_ENGINE_RTSP_WS_URL);

export async function detectPPE(
  file: File,
  confidence: number = 0.65
): Promise<DetectionResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const url = `${AI_URL}/api/v1/detect?confidence=${confidence}&include_annotated=true`;
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Detection failed with status: ${response.status}`);
  }

  return response.json();
}

export async function checkAIHealth(): Promise<{
  healthy: boolean;
  status: string;
  classes?: Record<string, string>;
}> {
  try {
    const response = await fetch(`${AI_URL}/health`, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return { healthy: false, status: "offline" };
    const data = await response.json();
    return {
      healthy: data.status === "healthy",
      status: data.status,
      classes: data.classes,
    };
  } catch {
    return { healthy: false, status: "unreachable" };
  }
}

export function createStreamWebSocket(
  onMessage: (data: unknown) => void,
  onError?: (err: Event) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket {
  const ws = new WebSocket(WS_URL);
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error("Failed to parse websocket message:", e);
    }
  };
  if (onError) ws.onerror = onError;
  if (onClose) ws.onclose = onClose;
  return ws;
}

export function createRTSPWebSocket(
  onMessage: (data: unknown) => void,
  onError?: (err: Event) => void,
  onClose?: (event: CloseEvent) => void
): WebSocket {
  const ws = new WebSocket(RTSP_WS_URL);
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error("Failed to parse RTSP websocket message:", e);
    }
  };
  if (onError) ws.onerror = onError;
  if (onClose) ws.onclose = onClose;
  return ws;
}
