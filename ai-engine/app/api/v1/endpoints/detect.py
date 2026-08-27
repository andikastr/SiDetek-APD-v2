import io
from fastapi import APIRouter, File, UploadFile, Query, HTTPException, status
from PIL import Image

from app.core.onnx_engine import onnx_engine
from app.schemas.detection import DetectionResponse

router = APIRouter()

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"]

@router.post(
    "/detect",
    response_model=DetectionResponse,
    summary="Deteksi Objek APD pada Gambar",
    description="Menerima file gambar (JPG, PNG, WEBP), mendeteksi Safety-Helmet dan Reflective-Jacket, serta mengevaluasi tingkat kepatuhan K3."
)
async def detect_ppe_image(
    file: UploadFile = File(..., description="File gambar pekerja konstruksi"),
    confidence: float = Query(0.65, ge=0.05, le=0.95, description="Ambang batas kepercayaan deteksi (0.05 - 0.95)"),
    include_annotated: bool = Query(True, description="Sertakan gambar hasil anotasi dalam format base64")
):
    # Validasi tipe file
    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format file tidak didukung: {file.content_type}. Gunakan JPG, PNG, atau WEBP."
        )

    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File yang diunggah kosong."
            )
            
        image_pil = Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal membaca file gambar: {str(e)}"
        )

    try:
        engine = onnx_engine()
        response = engine.predict(
            image_pil=image_pil,
            conf_threshold=confidence,
            include_annotated=include_annotated
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat inferensi deteksi: {str(e)}"
        )
