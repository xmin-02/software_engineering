<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# test_api

## Purpose
FastAPI 백엔드의 엔드포인트 및 라우팅 로직에 대한 통합 테스트 디렉토리. 현재는 초기화 파일만 존재한다.

## Key Files
| File | Description |
|------|-------------|
| __init__.py | 패키지 마커 (테스트 모듈로 인식하게 함) |

## For AI Agents

### Working In This Directory
이 디렉토리에서 작업할 때는:
- **테스트 작성**: FastAPI 라우터별 통합 테스트. 데이터베이스 연동 포함.
- **파일 규칙**: `test_<router_or_feature>.py` 형식. 예: `test_posts.py`, `test_places.py`, `test_auth.py`.
- **클라이언트**: FastAPI의 TestClient 사용. `from fastapi.testclient import TestClient`.
- **테스트 실행**: pytest로 실행. `pytest tests/test_api/`
- **데이터베이스**: 테스트용 임시 DB 또는 모의 DB 사용. Fixture로 전후 정리.
- **상태 코드**: 정상(200), 생성(201), 오류(400, 404, 500) 등 검증.

### Test Structure Pattern
```python
import pytest
from fastapi.testclient import TestClient
from app import app

@pytest.fixture
def client():
    return TestClient(app)

def test_get_posts(client):
    """포스트 목록 조회 테스트"""
    response = client.get("/api/posts")
    assert response.status_code == 200
    assert "items" in response.json()
```

## Dependencies

### Internal
- `app` 또는 `api.*` — FastAPI 애플리케이션 및 라우터 (구현 필요)
- `tests/test_analyzers` — 분석 모듈 테스트 (선택사항)

### External
- `pytest` — 테스트 프레임워크
- `fastapi` — TestClient를 위한 FastAPI
- `httpx` (optional) — 비동기 테스트용

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
