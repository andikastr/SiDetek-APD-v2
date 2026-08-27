from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class ComplianceStatus(str, Enum):
    COMPLIANT = "COMPLIANT"             # Full APD (Helm + Rompi)
    PARTIAL = "PARTIAL"                 # Parsial (Hanya salah satu)
    NON_COMPLIANT = "NON_COMPLIANT"     # Tidak memakai APD standar

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    norm_x1: float
    norm_y1: float
    norm_x2: float
    norm_y2: float
    width: float
    height: float

class DetectedObject(BaseModel):
    class_id: int
    label: str
    confidence: float
    bbox: BoundingBox

class ComplianceReport(BaseModel):
    status: ComplianceStatus
    helmet_count: int = 0
    jacket_count: int = 0
    total_detected: int = 0
    compliance_score: float = 0.0  # 0 to 100%
    message: str
    recommendations: List[str] = Field(default_factory=list)

class DetectionResponse(BaseModel):
    status: str = "success"
    inference_time_ms: float
    image_width: int
    image_height: int
    objects: List[DetectedObject] = Field(default_factory=list)
    compliance: ComplianceReport
    annotated_image_base64: Optional[str] = None

class StreamFrameResponse(BaseModel):
    status: str = "success"
    inference_time_ms: float
    fps: float
    objects: List[DetectedObject] = Field(default_factory=list)
    compliance: ComplianceReport
    frame_base64: Optional[str] = None
