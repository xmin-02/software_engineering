<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# youth

## Purpose
천안 소재 대학교의 공지사항(입시, 공모전, 행사, 장학금 등)을 수집합니다. 단국대, 호서대, 백석대 공식 웹사이트의 공지사항 페이지를 크롤링합니다.

## Key Files
| File | Description |
|------|-------------|
| `__init__.py` | 모듈 진입점 |
| `university_notice.py` | 천안 지역 대학 공지사항 크롤러 (UniversityNoticeCrawler) |

## For AI Agents

### Working In This Directory
- **university_notice.py**: 천안 소재 3개 대학 공지사항 통합 크롤러
  - `UniversityNoticeCrawler(university_keys=["단국대", "호서대", "백석대"], max_pages=3)`
  - 지원 대학:
    - 단국대 (Dankook): 별도 포털 UI, onclick으로 게시글 ID 추출
    - 호서대 (Hoseo): 테이블 기반 목록, href에서 article ID 추출
    - 백석대 (Baekseok): 테이블 기반 목록, href에서 article ID 추출
  - 데이터: 대학명, 제목, 카테고리([카테고리] 형식에서 추출), 게시 날짜, 상세 URL
  - source_id: "{대학약자}_{article_id}" (dku_, hoseo_, bu_ 프리픽스)
  - 중복 체크: source_id 기반
  - 각 대학별 parser 메서드 분리 (_parse_dankook, _parse_hoseo, _parse_baekseok)

### Common Patterns
- **Parser Method Dispatch**: 대학별 서로 다른 HTML 구조에 대응하기 위해 별도 parser 메서드 동적 호출
- **Regex ID Extraction**: onclick/href 속성에서 정규표현식으로 게시글 ID 추출
- **Category Parsing**: [카테고리] 형식 제목에서 정규표현식으로 카테고리/제목 분리
- **Date Parsing**: 다양한 포맷 지원 (YYYY-MM-DD, YYYY.MM.DD, YYYY-MM-DD HH:MM:SS)
- **Rate Limiting**: 1.0초 최소 간격으로 페이지 요청 (각 page 요청마다 wait())
- **Session Management**: requests.Session 사용, User-Agent 헤더 포함

## Dependencies

### Internal
- `crawler.base.BaseCrawler` — 모든 크롤러의 부모 클래스
- `crawler.common.rate_limiter.RateLimiter` — 요청 간격 제어

### External
- `requests` — HTTP 요청
- `beautifulsoup4` — HTML 파싱 (CSS selector, 텍스트 추출)
- `sqlalchemy` — ORM, 데이터베이스 세션
- `backend.models.content.UniversityNotice` — 대학 공지사항 ORM 모델
- `re` — 정규표현식 (게시글 ID 추출, 카테고리 파싱, 날짜 검증)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
