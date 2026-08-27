import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "SiDetek-APD AI Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Model (Prioritize optimized ONNX if available, fallback to PyTorch .pt)
    WEIGHTS_DIR: Path = BASE_DIR / "weights"
    MODEL_PATH: str = os.getenv(
        "MODEL_PATH",
        str(BASE_DIR / "weights" / "model-deteksi-apd.onnx")
        if (BASE_DIR / "weights" / "model-deteksi-apd.onnx").exists()
        else str(BASE_DIR / "weights" / "model-deteksi-apd.pt")
    )
    DEFAULT_CONF_THRESHOLD: float = 0.65
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
