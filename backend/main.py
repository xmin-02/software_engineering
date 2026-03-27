from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.config import settings

app = FastAPI(
    title="Cheonan Community Sentiment & Life Info API",
    version="2.0.0",
    description="천안 지역 여론 분석 및 연령별 생활 정보 API",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 전역 예외 핸들러
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "detail": str(exc)},
    )


@app.get("/health")
def health_check():
    return {"status": "ok"}


# 라우터 등록
from backend.routes.dashboard import router as dashboard_router
from backend.routes.places import router as places_router
from backend.routes.events import router as events_router
from backend.routes.youth import router as youth_router
from backend.routes.college import router as college_router
from backend.routes.jobs import router as jobs_router
from backend.routes.certifications import router as certifications_router
from backend.routes.family import router as family_router
from backend.routes.pipeline import router as pipeline_router

app.include_router(dashboard_router)
app.include_router(places_router)
app.include_router(events_router)
app.include_router(youth_router)
app.include_router(college_router)
app.include_router(jobs_router)
app.include_router(certifications_router)
app.include_router(family_router)
app.include_router(pipeline_router)
