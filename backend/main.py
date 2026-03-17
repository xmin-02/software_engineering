from fastapi import FastAPI

from backend.config import settings

app = FastAPI(
    title="Cheonan Community Sentiment & Life Info API",
    version="2.0.0",
    description="천안 지역 여론 분석 및 연령별 생활 정보 API",
)


@app.get("/health")
def health_check():
    return {"status": "ok"}
