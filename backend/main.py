from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import connect_db, close_db
from app.api.realestate import router as realestate_router
from app.api.export import router as export_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    description="부동산 정보 검색 및 관리 API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(realestate_router, prefix="/api/realestate", tags=["부동산"])
app.include_router(export_router, prefix="/api/export", tags=["내보내기"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
