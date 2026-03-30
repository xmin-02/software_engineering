<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# dashboard

## Purpose
천안 여론 분석 대시보드의 핵심 API 엔드포인트 모음. 감성 분석, 토픽 모델링, 키워드 추출, 요약, 게시글 조회 등 대시보드 UI에 필요한 모든 데이터를 제공하는 라우터들을 관리하는 디렉토리입니다.

## Key Files
| File | Description |
|------|-------------|
| `__init__.py` | 모든 대시보드 라우터 통합 및 FastAPI 라우터 레지스트리 |
| `posts.py` | `/api/posts` - 감성 및 날짜 범위로 필터링된 게시글 목록 조회 (페이지네이션) |
| `stats.py` | `/api/stats/sentiment`, `/api/stats/trend`, `/api/stats/sources` - 감성 통계, 시간대별 트렌드, 소스별 통계 |
| `keywords.py` | `/api/keywords` - 빈도수 상위 키워드 목록 (워드클라우드용) |
| `topics.py` | `/api/topics`, `/api/topics/{topic_id}/posts` - 주간/일일 토픽 및 토픽별 게시글 조회 |
| `summaries.py` | `/api/summaries` - 주간 AI 요약문 목록 조회 |

## For AI Agents

### Working In This Directory
이 디렉토리의 모든 라우터는 `dashboard_service`에서 데이터를 조회합니다. 새로운 엔드포인트를 추가할 때:
1. `backend.services.dashboard_service`의 해당 함수가 존재하는지 확인
2. 요청 파라미터(필터, 페이지네이션)는 Query/Depends를 사용
3. 응답 모델은 `backend.schemas.dashboard`에서 import
4. 모든 엔드포인트는 `tags=["Dashboard"]` 붙음

### Common Patterns
- **필터링**: `source`, `sentiment`, `date_from`, `date_to` 파라미터 활용
- **페이지네이션**: `PaginationParams` Depends 사용 → offset/limit 전달
- **응답 모델**: `PaginatedResponse[T]`, `list[ResponseSchema]` 등 강타입 사용
- **에러 처리**: 서비스 계층에서 처리되며 라우터는 직접 결과 반환

## Dependencies

### Internal
- `backend.deps`: `get_db`, `PaginationParams`
- `backend.schemas.dashboard`: 모든 응답 스키마 (KeywordFrequency, PostResponse, SentimentStats, TrendPoint, SourceStats, TopicResponse, WeeklySummaryResponse)
- `backend.schemas.common`: `PaginatedResponse`
- `backend.services.dashboard_service`: 모든 데이터 조회 로직

### External
- FastAPI: APIRouter, Depends, Query
- SQLAlchemy: Session ORM

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
