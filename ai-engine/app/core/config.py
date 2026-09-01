import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "SiDetek-APD AI Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Server (Auto-loaded from .env HOST and PORT)
    HOST: str = "0.0.0.0"
    PORT: int = 8100

    # Model (Prioritize optimized ONNX if available, fallback to PyTorch .pt)
    WEIGHTS_DIR: Path = BASE_DIR / "weights"
    MODEL_PATH: str = (
        str(BASE_DIR / "weights" / "model-deteksi-apd.onnx")
        if (BASE_DIR / "weights" / "model-deteksi-apd.onnx").exists()
        else str(BASE_DIR / "weights" / "model-deteksi-apd.pt")
    )
    DEFAULT_CONF_THRESHOLD: float = 0.65

    # Optional custom CORS origins from .env (e.g. CORS_ORIGINS="http://localhost:3000,https://my-app.com")
    CORS_ORIGINS: str = ""

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

    @property
    def BACKEND_CORS_ORIGINS(self) -> list[str]:
        """
        Dynamically generate allowed CORS origins based on the active configured PORT
        and common frontend ports, plus any custom domains in .env.
        """
        origins = {
            # Active backend port dynamically bound to self.PORT
            f"http://localhost:{self.PORT}",
            f"http://127.0.0.1:{self.PORT}",
            f"http://0.0.0.0:{self.PORT}",
            # Common local frontend development ports
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3100",
            "http://127.0.0.1:3100",
            "http://localhost:8000",
            "http://127.0.0.1:8000",
            # Wildcard fallback for local development
            "*",
        }

        # Include custom domain/port if configured in .env
        if self.CORS_ORIGINS:
            for item in self.CORS_ORIGINS.split(","):
                clean = item.strip()
                if clean:
                    origins.add(clean)

        return list(origins)

settings = Settings()
