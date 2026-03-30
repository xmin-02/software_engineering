<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# routes

## Purpose
FastAPI 라우터 계층으로, 천안시 정보 API의 엔드포인트를 정의합니다. 청년(대학공지), 대학생(공모전/장학금/주택), 구직자(채용정보), 자격시험, 가족(부동산), 이벤트, 장소(레스토랑/카페), 파이프라인, 그리고 대시보드 API를 제공합니다.

## Key Files
| File | Description |
|------|-------------|
| `__init__.py` | (비어있음) |
| `youth.py` | 청년용 API: 대학 공지사항 조회 |
| `college.py` | 대학생용 API: 공모전, 장학금, 대학생 주택 조회 |
| `jobs.py` | 채용정보 API: 경험 레벨, 채용 유형별 필터링, 페이지네이션 |
| `certifications.py` | 자격시험 API: 카테고리별, 예정 시험 필터링 |
| `family.py` | 가족용 API: 부동산 실거래 조회 |
| `events.py` | 이벤트 API: 카테고리별, 예정 행사 필터링 |
| `places.py` | 장소 API: 필터링, 정렬, 상세, 랭킹 조회 |
| `pipeline.py` | 파이프라인 API: 분석 파이프라인 백그라운드 실행 |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `dashboard/` | 대시보드 관련 라우터 (게시글, 통계, 토픽, 키워드, 요약) |

## For AI Agents

### Working In This Directory
이 디렉토리에서 일할 때는:
1. **라우터 생성**: 각 도메인별로 `APIRouter(prefix="/api/{domain}", tags=["{Domain}"])`로 시작합니다.
2. **의존성 주입**: `get_db`, `PaginationParams`, `verify_api_key` 등의 의존성을 통해 DB 연결과 인증을 처리합니다.
3. **필터링 쿼리**: 선택적 필터(category, tags, sentiment 등)는 `query.filter()`로 조건부 적용합니다.
4. **응답 모델**: 항상 Pydantic 스키마(`response_model`)을 명시합니다.
5. **페이지네이션**: 리스트 조회 시 `PaginationParams`를 사용하고 `PaginatedResponse` 래퍼를 반환합니다.
6. **에러 처리**: 404, 유효하지 않은 요청 등은 `HTTPException`으로 처리합니다.

### Common Patterns
- **선택적 필터**: `param: str | None = None` 형태로 선택적 쿼리 파라미터를 받습니다.
- **정렬**: 대부분 deadline, published_at, rating 등으로 정렬하며, 내림차순 또는 오름차순을 명시합니다.
- **제한**: limit(100), limit(50) 등으로 응답 크기를 제한하여 성능을 최적화합니다.
- **연령별 필터**: places.py에서 age_group 파라미터로 연령대별 맞춤 필터링을 지원합니다.
- **통계 조회**: dashboard/ 라우터에서는 집계 함수(COUNT, AVG 등)를 활용한 통계 조회를 제공합니다.
- **태그 기반 검색**: places.py에서는 쉼표로 구분된 태그 목록을 지원합니다.

## Dependencies

### Internal
- `backend.deps`: get_db, PaginationParams, verify_api_key
- `backend.models`: Post, Place, Event, Job, Scholarship 등 ORM 모델
- `backend.schemas`: 응답 스키마 (Pydantic 모델)
- `backend.services`: 비즈니스 로직 서비스 (dashboard_service, place_service)

### External
- `fastapi`: APIRouter, Depends, HTTPException, BackgroundTasks
- `sqlalchemy.orm`: Session, selectinload

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
