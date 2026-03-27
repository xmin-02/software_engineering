from fastapi import APIRouter

from backend.routes.dashboard.posts import router as posts_router
from backend.routes.dashboard.stats import router as stats_router
from backend.routes.dashboard.topics import router as topics_router
from backend.routes.dashboard.keywords import router as keywords_router
from backend.routes.dashboard.summaries import router as summaries_router

router = APIRouter(tags=["Dashboard"])
router.include_router(posts_router)
router.include_router(stats_router)
router.include_router(topics_router)
router.include_router(keywords_router)
router.include_router(summaries_router)
