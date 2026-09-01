import os
import sys
from pathlib import Path

# Ensure root directory of ai-engine is in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    print(f"[*] Starting {settings.PROJECT_NAME} on http://{settings.HOST}:{settings.PORT}")
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
