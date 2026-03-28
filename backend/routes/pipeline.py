from fastapi import APIRouter, BackgroundTasks, Depends

from backend.deps import verify_api_key

router = APIRouter(prefix="/api/pipeline", tags=["Pipeline"])


def _run_pipeline():
    """백그라운드 파이프라인 실행"""
    from analyzer.pipeline import AnalysisPipeline
    pipeline = AnalysisPipeline()
    pipeline.run()


@router.post("/run")
def trigger_pipeline(
    background_tasks: BackgroundTasks,
    _api_key: str = Depends(verify_api_key),
):
    background_tasks.add_task(_run_pipeline)
    return {"status": "started", "message": "Pipeline execution started in background"}
