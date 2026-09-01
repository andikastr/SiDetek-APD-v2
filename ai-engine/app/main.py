import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.onnx_engine import onnx_engine
from app.api.v1.router import api_router

start_time = time.time()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: load ONNX model weights into memory
    print(f"[{settings.PROJECT_NAME}] Starting up and warming up ONNX engine...")
    try:
        engine = onnx_engine()
        print(f"[{settings.PROJECT_NAME}] ONNX Engine ready for inference.")
    except Exception as e:
        print(f"[{settings.PROJECT_NAME}] CRITICAL: Failed to initialize YOLO engine: {e}")
    yield
    # Shutdown
    print(f"[{settings.PROJECT_NAME}] Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Microservice Deteksi Alat Pelindung Diri (APD) K3 Konstruksi menggunakan YOLOv11.",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["General"])
async def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", tags=["General"])
@app.get(f"{settings.API_V1_STR}/health", tags=["General"])
async def health_check():
    uptime_seconds = round(time.time() - start_time, 1)
    engine_ready = False
    model_classes = {}
    try:
        engine = onnx_engine()
        if engine.model is not None:
            engine_ready = True
            model_classes = engine.names
    except Exception:
        engine_ready = False

    return JSONResponse(
        status_code=200 if engine_ready else 503,
        content={
            "status": "healthy" if engine_ready else "unhealthy",
            "model_loaded": engine_ready,
            "classes": model_classes,
            "uptime_seconds": uptime_seconds
        }
    )

if __name__ == "__main__":
    import sys
    from pathlib import Path
    ROOT_DIR = Path(__file__).resolve().parent.parent
    if str(ROOT_DIR) not in sys.path:
        sys.path.insert(0, str(ROOT_DIR))

    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
