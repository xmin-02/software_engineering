<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# events

## Purpose
천안시 관광/축제/행사 정보를 수집합니다. 공공데이터포털의 천안시 행사 정보 API와 한국관광공사 축제 API 기반 크롤러를 제공합니다.

## Key Files
| File | Description |
|------|-------------|
| `__init__.py` | 모듈 진입점 |
| `cheonan_events.py` | data.go.kr 천안시 행사 정보 API 크롤러 (CheonanEventsCrawler) |
| `festival_crawler.py` | 한국관광공사 축제 정보 API 크롤러 (FestivalCrawler) |

## For AI Agents

### Working In This Directory
- **cheonan_events.py**: 공공데이터포털 천안시 관광/행사 정보 API
  - `CheonanEventsCrawler(per_page=100)`: 페이지당 항목 수 설정
  - `crawl()`: 전체 페이지 순회하며 행사 정보 수집, 총 건수 기반 페이지네이션
  - 데이터: 제목, 설명(태그), 주소, 홈페이지 URL, 카테고리
  - 태그 첫 번째 항목을 카테고리로 분류
  - 중복 체크: 제목 + 주소 조합

- **festival_crawler.py**: 한국관광공사 축제 검색 API
  - `FestivalCrawler(api_key, per_page=50)`: API 키 필수, 페이지당 항목 수 설정
  - `crawl()`: 충남 천안시(area_code=34, sigungu_code=4) 축제만 수집
  - 오늘 이후의 축제 정보만 검색 (eventStartDate 파라미터)
  - 데이터: 제목, 설명(전화), 주소, 시작/종료일, 상세페이지 URL, 카테고리("축제")
  - 날짜 포맷: YYYYMMDD → datetime.date 변환
  - 중복 체크: 제목 + 시작일 조합

### Common Patterns
- **Pagination**: 총 건수 기반으로 마지막 페이지 판단 (검색결과 < 한 페이지 크기)
- **Rate Limiting**: 0.5초 최소 간격으로 API 호출 (RateLimiter 사용)
- **Error Handling**: 요청 실패 시 빈 리스트 반환, 세션 정상 종료
- **Date Parsing**: YYYYMMDD 형식 → datetime.date 변환, 파싱 실패 시 None

## Dependencies

### Internal
- `crawler.base.BaseCrawler` — 모든 크롤러의 부모 클래스
- `crawler.common.rate_limiter.RateLimiter` — 요청 간격 제어

### External
- `requests` — HTTP JSON API 요청
- `sqlalchemy` — ORM, 데이터베이스 세션
- `backend.config.settings` — API 키 설정 (data_go_kr_api_key)
- `backend.models.content.Event` — 행사/축제 ORM 모델

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
