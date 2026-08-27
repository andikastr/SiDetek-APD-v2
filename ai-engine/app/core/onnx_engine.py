import io
import time
import base64
import ast
from typing import Tuple, List, Optional, Dict
import numpy as np
import cv2
from PIL import Image

from app.core.config import settings
from app.core.compliance import evaluate_compliance
from app.schemas.detection import (
    BoundingBox,
    DetectedObject,
    DetectionResponse,
    StreamFrameResponse
)

# Colors for bounding boxes (BGR)
COLOR_HELMET_BGR = (129, 185, 16)   # #10b981 Emerald
COLOR_JACKET_BGR = (11, 158, 245)   # #f59e0b Amber
COLOR_DEFAULT_BGR = (92, 27, 10)    # #0a1b5c Dark Navy


class ONNXEngine:
    """
    High-Performance Pure ONNX Runtime Inference Engine.
    Executes directly via onnxruntime without PyTorch overhead.
    Includes fallback to Ultralytics if a .pt model path is explicitly provided.
    """
    _instance: Optional["ONNXEngine"] = None

    def __init__(self, model_path: str = settings.MODEL_PATH):
        self.model_path = model_path
        self.is_onnx: bool = str(self.model_path).endswith(".onnx")
        self.session = None
        self.ultralytics_model = None
        self.class_names: Dict[int, str] = {0: "Reflective-Jacket", 1: "Safety-Helmet"}
        self.input_name: str = "images"
        self.output_name: str = "output0"
        self.load_model()

    @property
    def model(self):
        """Compatibility property for legacy checks."""
        return self.session if self.session is not None else self.ultralytics_model

    @property
    def names(self):
        return self.class_names

    @classmethod
    def get_instance(cls) -> "ONNXEngine":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load_model(self):
        try:
            print(f"[ONNXEngine] Loading model weights from: {self.model_path}")
            if self.is_onnx:
                import onnxruntime as ort
                # Pure ONNX Runtime session
                session_opts = ort.SessionOptions()
                session_opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
                self.session = ort.InferenceSession(
                    self.model_path,
                    sess_options=session_opts,
                    providers=["CPUExecutionProvider"]
                )
                self.input_name = self.session.get_inputs()[0].name
                self.output_name = self.session.get_outputs()[0].name
                
                # Extract class names from ONNX model metadata if present
                meta = self.session.get_modelmeta().custom_metadata_map
                if "names" in meta:
                    try:
                        self.class_names = ast.literal_eval(meta["names"])
                    except Exception:
                        pass
                self.session.names = self.class_names
                print(f"[ONNXEngine] Pure ONNX Runtime Session active. Classes: {self.class_names}")
            else:
                from ultralytics import YOLO
                self.ultralytics_model = YOLO(self.model_path)
                self.class_names = self.ultralytics_model.names
                print(f"[ONNXEngine] Ultralytics Fallback active. Classes: {self.class_names}")
        except Exception as e:
            print(f"[ONNXEngine] Failed to load model: {e}")
            raise e

    def _letterbox_preprocess(
        self,
        image_bgr: np.ndarray,
        target_size: Tuple[int, int] = (640, 640)
    ) -> Tuple[np.ndarray, float, Tuple[float, float]]:
        """Resize image with constant aspect ratio and padding (letterbox)."""
        h0, w0 = image_bgr.shape[:2]
        tw, th = target_size
        r = min(th / h0, tw / w0)
        new_unpad = int(round(w0 * r)), int(round(h0 * r))
        dw, dh = (tw - new_unpad[0]) / 2.0, (th - new_unpad[1]) / 2.0

        if (w0, h0) != new_unpad:
            resized = cv2.resize(image_bgr, new_unpad, interpolation=cv2.INTER_LINEAR)
        else:
            resized = image_bgr

        top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
        left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
        padded = cv2.copyMakeBorder(
            resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(114, 114, 114)
        )

        # HWC BGR -> CHW RGB normalized to [0, 1]
        rgb = cv2.cvtColor(padded, cv2.COLOR_BGR2RGB)
        blob = rgb.astype(np.float32) / 255.0
        blob = blob.transpose(2, 0, 1)[None, ...]
        return blob, r, (dw, dh)

    def _postprocess_onnx(
        self,
        raw_output: np.ndarray,
        r: float,
        dwdh: Tuple[float, float],
        orig_shape: Tuple[int, int],
        conf_threshold: float,
        iou_threshold: float = 0.45
    ) -> List[DetectedObject]:
        """Post-process ONNX (1, 6, 8400) output tensor using OpenCV NMS."""
        orig_h, orig_w = orig_shape
        dw, dh = dwdh
        
        # Transpose from (1, 6, 8400) to (8400, 6)
        preds = raw_output[0].T
        
        # Fast filter candidates with any class score >= conf_threshold
        class_scores = preds[:, 4:]
        max_scores = np.max(class_scores, axis=1)
        valid_indices = np.where(max_scores >= conf_threshold)[0]
        
        if len(valid_indices) == 0:
            return []

        filtered_preds = preds[valid_indices]
        filtered_scores = class_scores[valid_indices]
        
        boxes = []
        confidences = []
        class_ids = []

        for pred, scores in zip(filtered_preds, filtered_scores):
            cls_id = int(np.argmax(scores))
            conf = float(scores[cls_id])
            
            cx, cy, w, h = pred[:4]
            # Rescale from 640x640 letterbox coordinates back to original image space
            x1 = (cx - w / 2.0 - dw) / r
            y1 = (cy - h / 2.0 - dh) / r
            x2 = (cx + w / 2.0 - dw) / r
            y2 = (cy + h / 2.0 - dh) / r

            x1 = max(0.0, min(float(orig_w), x1))
            y1 = max(0.0, min(float(orig_h), y1))
            x2 = max(0.0, min(float(orig_w), x2))
            y2 = max(0.0, min(float(orig_h), y2))

            boxes.append([int(x1), int(y1), int(x2 - x1), int(y2 - y1)])
            confidences.append(conf)
            class_ids.append(cls_id)

        nms_indices = cv2.dnn.NMSBoxes(boxes, confidences, conf_threshold, iou_threshold)
        if len(nms_indices) == 0:
            return []

        flat_indices = [int(idx[0] if isinstance(idx, (list, tuple, np.ndarray)) else idx) for idx in nms_indices]
        
        detected_objects: List[DetectedObject] = []
        for i in flat_indices:
            x, y, w, h = boxes[i]
            x1, y1, x2, y2 = float(x), float(y), float(x + w), float(y + h)
            cls_id = class_ids[i]
            label = self.class_names.get(cls_id, f"Class_{cls_id}")
            conf = round(confidences[i], 3)

            norm_x1 = max(0.0, min(1.0, x1 / orig_w))
            norm_y1 = max(0.0, min(1.0, y1 / orig_h))
            norm_x2 = max(0.0, min(1.0, x2 / orig_w))
            norm_y2 = max(0.0, min(1.0, y2 / orig_h))

            bbox = BoundingBox(
                x1=round(x1, 1),
                y1=round(y1, 1),
                x2=round(x2, 1),
                y2=round(y2, 1),
                norm_x1=round(norm_x1, 4),
                norm_y1=round(norm_y1, 4),
                norm_x2=round(norm_x2, 4),
                norm_y2=round(norm_y2, 4),
                width=round(w, 1),
                height=round(h, 1)
            )

            detected_objects.append(
                DetectedObject(
                    class_id=cls_id,
                    label=label,
                    confidence=conf,
                    bbox=bbox
                )
            )

        return detected_objects

    def _draw_annotations(
        self,
        image_bgr: np.ndarray,
        objects: List[DetectedObject]
    ) -> np.ndarray:
        """Draw crisp, high-visibility, resolution-scaled bounding boxes and labels."""
        annotated = image_bgr.copy()
        h, w = annotated.shape[:2]
        max_dim = max(h, w)

        # Dynamically scale thickness and font relative to image resolution
        line_thickness = max(3, int(round(max_dim * 0.0035)))
        font_scale = max(0.5, max_dim * 0.00075)
        font_thickness = max(2, int(round(line_thickness * 0.55)))

        # Ultra-vibrant BGR colors (Neon Green / Safety Amber)
        COLOR_HELMET = (46, 230, 0)     # Neon Green / Emerald
        COLOR_JACKET = (0, 145, 255)    # Safety Orange / Amber

        for obj in objects:
            is_helmet = "helmet" in obj.label.lower()
            color = COLOR_HELMET if is_helmet else COLOR_JACKET
            
            x1, y1 = int(obj.bbox.x1), int(obj.bbox.y1)
            x2, y2 = int(obj.bbox.x2), int(obj.bbox.y2)

            # 1. Dark outer contrast border (drop shadow line)
            cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 0), line_thickness + 2, cv2.LINE_AA)

            # 2. Vibrant main colored box stroke
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, line_thickness, cv2.LINE_AA)

            # 3. Label text & background badge
            label_text = f" {obj.label} {int(round(obj.confidence * 100))}% "
            font = cv2.FONT_HERSHEY_SIMPLEX
            (text_w, text_h), baseline = cv2.getTextSize(label_text, font, font_scale, font_thickness)

            badge_y1 = max(0, y1 - text_h - 12)
            badge_y2 = max(text_h + 12, y1)
            badge_x2 = min(w, x1 + text_w + 10)

            # Black shadow border for badge
            cv2.rectangle(annotated, (x1 - 1, badge_y1 - 1), (badge_x2 + 1, badge_y2 + 1), (0, 0, 0), -1)
            # Solid color background for label badge
            cv2.rectangle(annotated, (x1, badge_y1), (badge_x2, badge_y2), color, -1)
            
            # High-contrast bold black text on bright background for maximum readability
            text_y = badge_y2 - int(baseline * 0.8) - 4
            cv2.putText(
                annotated,
                label_text,
                (x1 + 4, text_y),
                font,
                font_scale,
                (0, 0, 0),
                font_thickness,
                cv2.LINE_AA
            )
        return annotated

    def predict(
        self,
        image_pil: Image.Image,
        conf_threshold: float = settings.DEFAULT_CONF_THRESHOLD,
        include_annotated: bool = True
    ) -> DetectionResponse:
        """Process a single PIL image with Pure ONNX or Ultralytics fallback."""
        start_time = time.perf_counter()
        orig_w, orig_h = image_pil.size

        # Convert PIL RGB to OpenCV BGR
        image_bgr = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)

        if self.is_onnx and self.session is not None:
            # --- PURE ONNX RUNTIME PIPELINE ---
            blob, r, dwdh = self._letterbox_preprocess(image_bgr)
            raw_outputs = self.session.run([self.output_name], {self.input_name: blob})[0]
            detected_objects = self._postprocess_onnx(
                raw_output=raw_outputs,
                r=r,
                dwdh=dwdh,
                orig_shape=(orig_h, orig_w),
                conf_threshold=conf_threshold
            )
        else:
            # --- ULTRALYTICS FALLBACK ---
            results = self.ultralytics_model(image_pil, conf=conf_threshold, verbose=False)
            detected_objects = []
            for box in results[0].boxes:
                cls_id = int(box.cls[0])
                label = self.class_names.get(cls_id, f"Class_{cls_id}")
                conf = round(float(box.conf[0]), 3)
                x1, y1, x2, y2 = [float(coord) for coord in box.xyxy[0].tolist()]
                detected_objects.append(
                    DetectedObject(
                        class_id=cls_id,
                        label=label,
                        confidence=conf,
                        bbox=BoundingBox(
                            x1=round(x1, 1), y1=round(y1, 1), x2=round(x2, 1), y2=round(y2, 1),
                            norm_x1=round(x1 / orig_w, 4), norm_y1=round(y1 / orig_h, 4),
                            norm_x2=round(x2 / orig_w, 4), norm_y2=round(y2 / orig_h, 4),
                            width=round(x2 - x1, 1), height=round(y2 - y1, 1)
                        )
                    )
                )

        inference_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        compliance = evaluate_compliance(detected_objects)

        annotated_b64 = None
        if include_annotated:
            annotated_bgr = self._draw_annotations(image_bgr, detected_objects)
            _, buf = cv2.imencode(".jpg", annotated_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
            annotated_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

        return DetectionResponse(
            status="success",
            inference_time_ms=inference_time_ms,
            image_width=orig_w,
            image_height=orig_h,
            objects=detected_objects,
            compliance=compliance,
            annotated_image_base64=annotated_b64
        )

    def predict_frame_bytes(
        self,
        frame_bytes: bytes,
        conf_threshold: float = settings.DEFAULT_CONF_THRESHOLD
    ) -> StreamFrameResponse:
        """Decode frame bytes and run inference directly with Pure ONNX."""
        start_time = time.perf_counter()
        nparr = np.frombuffer(frame_bytes, np.uint8)
        frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame_bgr is None:
            raise ValueError("Could not decode image frame.")

        orig_h, orig_w = frame_bgr.shape[:2]
        blob, r, dwdh = self._letterbox_preprocess(frame_bgr)
        raw_outputs = self.session.run([self.output_name], {self.input_name: blob})[0]
        detected_objects = self._postprocess_onnx(
            raw_output=raw_outputs,
            r=r,
            dwdh=dwdh,
            orig_shape=(orig_h, orig_w),
            conf_threshold=conf_threshold
        )
        compliance = evaluate_compliance(detected_objects)

        elapsed = time.perf_counter() - start_time
        fps = round(1.0 / elapsed, 1) if elapsed > 0 else 0.0

        return StreamFrameResponse(
            status="success",
            inference_time_ms=round(elapsed * 1000, 2),
            fps=fps,
            objects=detected_objects,
            compliance=compliance
        )

    def predict_cv2_frame(
        self,
        frame_bgr: np.ndarray,
        conf_threshold: float = settings.DEFAULT_CONF_THRESHOLD,
        include_annotated: bool = True
    ) -> StreamFrameResponse:
        """Run Pure ONNX inference directly on an OpenCV BGR frame (e.g. from RTSP stream)."""
        start_time = time.perf_counter()
        orig_h, orig_w = frame_bgr.shape[:2]

        blob, r, dwdh = self._letterbox_preprocess(frame_bgr)
        raw_outputs = self.session.run([self.output_name], {self.input_name: blob})[0]
        detected_objects = self._postprocess_onnx(
            raw_output=raw_outputs,
            r=r,
            dwdh=dwdh,
            orig_shape=(orig_h, orig_w),
            conf_threshold=conf_threshold
        )
        compliance = evaluate_compliance(detected_objects)

        frame_b64 = None
        if include_annotated:
            annotated_bgr = self._draw_annotations(frame_bgr, detected_objects)
            _, buf = cv2.imencode(".jpg", annotated_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 75])
            frame_b64 = base64.b64encode(buf.tobytes()).decode("utf-8")

        elapsed = time.perf_counter() - start_time
        fps = round(1.0 / elapsed, 1) if elapsed > 0 else 0.0

        return StreamFrameResponse(
            status="success",
            inference_time_ms=round(elapsed * 1000, 2),
            fps=fps,
            objects=detected_objects,
            compliance=compliance,
            frame_base64=frame_b64
        )


onnx_engine = ONNXEngine.get_instance
