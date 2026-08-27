from fastapi import APIRouter
from app.api.v1.endpoints import detect, stream

api_router = APIRouter()
api_router.include_router(detect.router, tags=["Detection"])
api_router.include_router(stream.router, tags=["Streaming"])
