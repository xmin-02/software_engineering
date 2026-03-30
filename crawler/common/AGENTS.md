<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# common

## Purpose
크롤러들이 공통으로 사용하는 유틸리티 모듈입니다. 요청 간격 제어(RateLimiter), 공공데이터포털 부동산 실거래가 수집(RealEstateCrawler)을 제공합니다.

## Key Files
| File | Description |
|------|-------------|
| `__init__.py` | 모듈 진입점 |
| `rate_limiter.py` | 요청 간격 제어 유틸리티 (RateLimiter 클래스, rate_limited 데코레이터) |
| `real_estate.py` | data.go.kr 부동산 API 기반 천안시 아파트 매매/전월세 실거래가 크롤러 |

## For AI Agents

### Working In This Directory
- **rate_limiter.py**: HTTP 요청 간격을 일정하게 유지하려면 `RateLimiter` 클래스 또는 `@rate_limited` 데코레이터를 사용하세요.
  - `RateLimiter(min_interval=1.0)`: 최소 간격(초 단위) 설정 가능
  - `wait()` 메서드: 마지막 호출 이후 충분한 시간이 경과했으면 통과, 아니면 대기
  - 데코레이터로 함수 호출 간격 자동 제어 가능

- **real_estate.py**: 천안시(서북구, 동남구) 부동산 매매/전월세 데이터 수집
  - `RealEstateCrawler(months=3)`: 최근 N개월 데이터 기본값 3개월
  - `crawl()`: API 호출 후 파싱된 딕셔너리 리스트 반환
  - `save()`: 중복 제거하며 DB에 저장, 저장 건수 반환
  - 매매/전월세 구분, 보증금/월세 정보 분리 저장
  - source_id 조합: 거래 유형, 구, 건물명, 날짜, 면적, 층, 가격

### Common Patterns
- **Rate Limiting**: 모든 외부 API 호출 전에 rate limiter 적용 필수
- **Deduplication**: source_id 기반 중복 제거 (기존 DB 레코드 확인 후 저장)
- **Error Handling**: requests.RequestException 캐치하여 빈 리스트 반환
- **Date Parsing**: 다양한 날짜 포맷 지원 (YYYYMMDD, YYYY-MM-DD 등)

## Dependencies

### Internal
- `crawler.base.BaseCrawler` — 모든 크롤러의 부모 클래스

### External
- `requests` — HTTP 요청
- `beautifulsoup4` — XML/HTML 파싱
- `sqlalchemy` — ORM, 데이터베이스 세션
- `backend.config.settings` — API 키 설정 (data_go_kr_api_key)
- `backend.models.content.RealEstate` — 부동산 ORM 모델

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
