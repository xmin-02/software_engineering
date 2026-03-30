<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# backend

## Purpose

FastAPI 기반 백엔드 애플리케이션. 천안 지역 여론 수집, 분석, 생활 정보 제공의 핵심 API 서버. 크롤링 + 분석 파이프라인을 스케줄링하고, 데이터베이스 계층을 관리하며, 연령별 맞춤 정보(여론, 장소, 행사, 일자리, 장학금 등)를 제공하는 RESTful 엔드포인트들을 노출한다.

## Key Files

| File | Description |
|------|-------------|
| `main.py` | FastAPI 앱 초기화, CORS 미들웨어 설정, 전역 예외 핸들러, 라우터 등록 |
| `config.py` | JSON 기반 설정 로더 (database.json, naver_api.json, kakao_api.json 등) |
| `database.py` | SQLAlchemy 엔진, 세션팩토리, `Base` 선언 클래스, 의존성 주입용 `get_db()` |
| `deps.py` | FastAPI 의존성 함수들 (DB 세션, API 키 검증, 페이지네이션 파라미터) |
| `scheduler.py` | APScheduler 기반 6시간 주기 크롤링 + 분석 파이프라인 자동화 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `models/` | SQLAlchemy ORM 엔티티 (Post, Place, Event, Job, Scholarship 등) — 데이터베이스 테이블 정의 (see `models/AGENTS.md`) |
| `routes/` | FastAPI 라우터 (dashboard, places, events, youth, college, jobs 등) — API 엔드포인트 정의 (see `routes/AGENTS.md`) |
| `schemas/` | Pydantic 응답/요청 모델 (PlaceResponse, PostResponse, SentimentStats 등) — API 직렬화 (see `schemas/AGENTS.md`) |
| `services/` | 비즈니스 로직 서비스 (place_service, dashboard_service) — 쿼리, 필터링, 정렬 로직 (see `services/AGENTS.md`) |

## For AI Agents

### Working In This Directory

1. **설정 변경**: `config.py`에서 JSON 기반 설정을 읽음. 새로운 API 키나 데이터베이스 URL이 필요하면 `config/` 폴더의 JSON 파일 추가 후 `Settings` 클래스에 프로퍼티 추가.
2. **라우터 추가**: `routes/` 폴더에 새로운 엔드포인트 정의. `main.py`의 `app.include_router()` 호출로 등록.
3. **스키마 확장**: `schemas/` 폴더에 Pydantic 모델 추가. `__init__.py`에서 내보내기.
4. **모델 추가**: `models/` 폴더에 SQLAlchemy ORM 클래스 추가. 데이터베이스 마이그레이션 필요 (Alembic 권장).
5. **서비스 로직**: `services/` 폴더에 비즈니스 로직을 함수/클래스로 작성. 라우터에서 호출.
6. **스케줄링**: `scheduler.py`의 `CrawlScheduler._setup_jobs()`에서 새로운 작업 등록. `start()` / `stop()` 호출로 제어.

### Testing Requirements

- **단위 테스트**: `tests/` 폴더에 라우터, 서비스, 모델 테스트 작성 (pytest).
- **DB 테스트**: SQLite 인메모리 DB 또는 테스트 PostgreSQL 인스턴스 사용.
- **API 테스트**: FastAPI의 `TestClient` 사용하여 엔드포인트 검증.
- **예제**:
  ```bash
  pytest tests/ -v
  pytest tests/test_routes/test_places.py -v
  ```

### Common Patterns

- **의존성 주입**: `fastapi.Depends()`로 DB 세션, 페이지네이션, API 키 검증 전달.
- **페이지네이션**: `PaginationParams` 의존성으로 `page`, `size` 파라미터 처리. 서비스에서 `offset = (page - 1) * size` 계산.
- **필터링/정렬**: 쿼리 파라미터로 필터 조건 받아 서비스 함수에 전달. SQLAlchemy `filter()`, `order_by()` 사용.
- **응답 모델**: Pydantic 스키마로 응답 직렬화. `response_model=PaginatedResponse[PlaceResponse]` 형식.
- **에러 처리**: `HTTPException` 사용. 상태 코드 (401, 404, 500) 및 `detail` 메시지 포함.
- **스케줄링**: APScheduler의 `IntervalTrigger` 사용하여 정기 작업 등록. 로깅으로 실행 결과 기록.

## Dependencies

### Internal
- `backend.models` — ORM 엔티티
- `backend.schemas` — Pydantic 스키마
- `backend.services` — 비즈니스 로직
- `backend.routes` — API 라우터
- `crawler.*` — 크롤링 모듈 (scheduler.py에서 동적 import)
- `analyzer.*` — 분석 파이프라인 (scheduler.py에서 동적 import)

### External
- **FastAPI** — 웹 프레임워크
- **SQLAlchemy 2.0** — ORM
- **Pydantic** — 데이터 검증
- **APScheduler** — 백그라운드 작업 스케줄링
- **PostgreSQL** — 데이터베이스 (psycopg2 드라이버)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
