import os
import sys
from pathlib import Path
from PIL import Image

# Ensure app package is importable
current_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(current_dir))

from app.core.onnx_engine import onnx_engine
from app.core.compliance import evaluate_compliance

def test_ai_engine():
    print("========================================")
    print("    SiDetek-APD AI Engine Test Suite    ")
    print("========================================")
    
    # 1. Initialize Engine
    print("\n[Step 1] Initializing ONNX Engine...")
    engine = onnx_engine()
    assert engine.model is not None, "Failed: Model is None!"
    print(f"  [OK] Model successfully loaded. Classes: {engine.names}")
    
    # 2. Test Image Inference
    test_img_path = current_dir / "assets" / "testing-apd-gundar5.jpg"
    print(f"\n[Step 2] Testing inference on sample image: {test_img_path.name}")
    assert test_img_path.exists(), f"Sample image not found at {test_img_path}"
    
    image_pil = Image.open(test_img_path)
    response = engine.predict(image_pil, conf_threshold=0.35, include_annotated=True)
    
    print(f"  [OK] Inference completed in {response.inference_time_ms} ms")
    print(f"  [OK] Image Resolution: {response.image_width}x{response.image_height}")
    print(f"  [OK] Total Objects Detected: {len(response.objects)}")
    
    for idx, obj in enumerate(response.objects, 1):
        print(f"    {idx}. {obj.label} (Conf: {obj.confidence:.2f}) -> BBox: [{obj.bbox.x1}, {obj.bbox.y1}, {obj.bbox.x2}, {obj.bbox.y2}]")
        assert 0.0 <= obj.bbox.norm_x1 <= 1.0, "Normalized coordinates out of range!"
        assert 0.0 <= obj.bbox.norm_y1 <= 1.0, "Normalized coordinates out of range!"
        
    # 3. Test Compliance Evaluation
    print(f"\n[Step 3] Verifying K3 Compliance Report:")
    report = response.compliance
    print(f"  - Status: {report.status.value}")
    print(f"  - Score: {report.compliance_score}%")
    print(f"  - Safety Helmets: {report.helmet_count}")
    print(f"  - Reflective Jackets: {report.jacket_count}")
    print(f"  - Message: {report.message}")
    print(f"  - Recommendations: {len(report.recommendations)} tips provided")
    
    assert report.helmet_count > 0, "Expected at least 1 helmet in test image!"
    assert report.jacket_count > 0, "Expected at least 1 reflective jacket in test image!"
    assert response.annotated_image_base64 is not None, "Annotated base64 image should not be empty!"
    
    print("\n========================================")
    print("  >>> ALL AI ENGINE TESTS PASSED! <<<   ")
    print("========================================")

if __name__ == "__main__":
    test_ai_engine()
