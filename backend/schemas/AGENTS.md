<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# schemas

## Purpose
Pydantic 응답 스키마 계층으로, FastAPI 라우터에서 반환하는 데이터의 형태를 정의합니다. 게시글, 장소, 이벤트, 채용, 부동산, 자격시험, 대학공지, 대시보드 통계 등의 응답 모델을 관리합니다.

## Key Files
| File | Description |
|------|-------------|
| `__init__.py` | 모든 스키마를 export하는 통합 진입점 |
| `common.py` | 공용 스키마: PaginatedResponse, ErrorResponse |
| `content.py` | 콘텐츠 응답 스키마: Event, UniversityNotice, Contest, Scholarship, Job, Certification, RealEstate |
| `dashboard.py` | 대시보드 응답 스키마: PostResponse, SentimentStats, TrendPoint, SourceStats, TopicResponse, KeywordFrequency, WeeklySummaryResponse |
| `place.py` | 장소 응답 스키마: PlaceResponse, PlaceReviewResponse, PlaceDetail, PlaceRanking |

## For AI Agents

### Working In This Directory
이 디렉토리에서 일할 때는:
1. **스키마 정의**: 모든 응답 스키마는 Pydantic `BaseModel`을 상속하고 필드 타입을 명시합니다.
2. **ORM 연동**: `model_config = {"from_attributes": True}`를 설정하여 SQLAlchemy ORM 객체와 자동 변환됩니다.
3. **선택적 필드**: 없을 수 있는 필드는 `field: type | None = None` 형태로 정의합니다.
4. **기본값**: 데이터가 없는 경우의 기본값을 명시합니다 (예: `score: float | None = None`, `count: int = 0`).
5. **설명 추가**: 클래스와 필드에 주석(한글)을 추가하여 의도를 명확히 합니다.
6. **__all__ 갱신**: 새 스키마 추가 시 `__init__.py`의 `__all__`에 등록합니다.

### Common Patterns
- **기본 응답**: 조회 응답은 id와 주요 필드들을 포함하고, 날짜 필드는 date 또는 datetime 타입입니다.
- **통계 응답**: SentimentStats, TrendPoint, SourceStats는 집계된 숫자 데이터를 담습니다.
- **계층 응답**: PlaceDetail처럼 여러 스키마를 조합하는 응답도 정의합니다.
- **리스트 응답**: 단순 리스트는 `list[SchemaType]`, 페이지네이션이 필요하면 `PaginatedResponse[SchemaType]`을 사용합니다.
- **분석 결과 포함**: PostResponse는 sentiment, keywords, topic 등 분석 결과를 함께 담습니다.
- **장소 통계**: PlaceResponse는 avg_sentiment_score, review_count 등 계산된 통계를 포함합니다.

## Dependencies

### Internal
- `backend.models`: ORM 모델에서 `from_attributes=True`로 자동 변환

### External
- `pydantic`: BaseModel, Field
- `datetime`: date, datetime

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
