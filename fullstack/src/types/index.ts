export type ComplianceStatus = "COMPLIANT" | "PARTIAL" | "NON_COMPLIANT";

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  norm_x1: number;
  norm_y1: number;
  norm_x2: number;
  norm_y2: number;
  width: number;
  height: number;
}

export interface DetectedObject {
  class_id: number;
  label: "Safety-Helmet" | "Reflective-Jacket" | string;
  confidence: number;
  bbox: BoundingBox;
}

export interface ComplianceReport {
  status: ComplianceStatus;
  helmet_count: number;
  jacket_count: number;
  total_detected: number;
  compliance_score: number;
  message: string;
  recommendations: string[];
}

export interface DetectionResponse {
  status: string;
  inference_time_ms: number;
  image_width: number;
  image_height: number;
  objects: DetectedObject[];
  compliance: ComplianceReport;
  annotated_image_base64?: string;
}

export interface StreamFrameResponse {
  status: string;
  inference_time_ms: number;
  fps: number;
  objects: DetectedObject[];
  compliance: ComplianceReport;
  frame_base64?: string;
}

export interface AuditRecord {
  id: string;
  createdAt: string;
  source: "UPLOAD" | "WEBCAM" | "RTSP";
  fileName?: string | null;
  originalImageUrl?: string | null;
  annotatedImageUrl?: string | null;
  complianceStatus: ComplianceStatus;
  complianceScore: number;
  helmetCount: number;
  jacketCount: number;
  totalDetected: number;
  inferenceMs: number;
  notes?: string | null;
  items?: {
    id: string;
    label: string;
    confidence: number;
    normX1: number;
    normY1: number;
    normX2: number;
    normY2: number;
  }[];
}

export interface DashboardStats {
  totalAudits: number;
  complianceRate: number;
  compliantCount: number;
  partialCount: number;
  violationCount: number;
  totalHelmets: number;
  totalJackets: number;
  recentAudits: AuditRecord[];
}

export interface CameraItem {
  id: string;
  name: string;
  type: "DEVICE" | "RTSP";
  url?: string | null;
  location?: string | null;
  isActive?: boolean;
  createdAt?: string;
}
