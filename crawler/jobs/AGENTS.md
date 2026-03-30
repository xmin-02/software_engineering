<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# jobs

## Purpose
워크넷(Work24) 채용정보 API를 통해 천안 지역 채용공고를 수집합니다.

## Key Files
| File | Description |
|------|-------------|
| `__init__.py` | 모듈 진입점 |
| `work24_crawler.py` | 워크넷 채용정보 XML API 크롤러 (Work24Crawler) |

## For AI Agents

### Working In This Directory
- **work24_crawler.py**: 워크넷 오픈 API 기반 채용공고 수집
  - `Work24Crawler(max_pages=5, display=20)`: 최대 페이지 수, 페이지당 항목 수 설정
  - 대상 지역: 천안시 동남구, 서북구 (region_codes: "44130", "44131")
  - `crawl()`: 모든 지역/페이지 순회, 중복 제거 후 결과 리스트 반환
  - 데이터: 공고명, 회사명, 근무지, 급여, 고용형태, 경력 요구, 마감일, 공고 URL
  - source_id: 워크넷 채용공고 번호(recrutPblntSn)
  - 마감일 파싱: YYYYMMDD, YYYY-MM-DD, YYYY.MM.DD 포맷 지원
  - 중복 제거: 수집 중 source_id 기반 중복 제거, DB 저장 시 재확인

### Common Patterns
- **XML Parsing**: ET.ParseError 예외 처리, 에러 응답 코드 확인 (messageCd != "000")
- **Logging**: 수집 결과, API 에러, 파싱 실패 상황 로깅
- **Rate Limiting**: 0.5초 최소 간격으로 API 호출 (RateLimiter 사용)
- **Deduplication**: source_id 기반 in-memory 중복 제거 후 DB 저장 시 재확인
- **Pagination**: 한 페이지 항목 수 < display 이면 마지막 페이지 판단, 최대 페이지 수로 제한

## Dependencies

### Internal
- `crawler.base.BaseCrawler` — 모든 크롤러의 부모 클래스
- `crawler.common.rate_limiter.RateLimiter` — 요청 간격 제어

### External
- `requests` — HTTP XML API 요청
- `xml.etree.ElementTree` — XML 파싱
- `sqlalchemy` — ORM, 데이터베이스 세션
- `backend.config.settings` — API 키 설정 (work24_auth_key)
- `backend.models.content.Job` — 채용공고 ORM 모델
- `logging` — 크롤링 로그 기록

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
