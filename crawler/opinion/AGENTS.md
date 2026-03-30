<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# opinion

## Purpose
천안 관련 여론을 수집합니다. 천안시청 시민소통 게시판, 디시인사이드 천안 갤러리, 네이버 블로그 검색을 통해 의견/뉴스/정보 게시글을 수집합니다.

## Key Files
| File | Description |
|------|-------------|
| `__init__.py` | 모듈 진입점 |
| `cheonan_city.py` | 천안시청 시민소통 게시판 크롤러 (CheonanCityCrawler) |
| `dcinside.py` | 디시인사이드 천안 마이너갤러리 크롤러 (DCInsideCrawler) |
| `naver_blog.py` | 네이버 블로그 검색 API 크롤러 (NaverBlogCrawler) |

## For AI Agents

### Working In This Directory
- **cheonan_city.py**: 천안시청 공식 게시판 (칭찬합시다, 정책연구/제안)
  - `CheonanCityCrawler(max_pages=5, board_keys=["praise", "policy"])`: 크롤링 대상 게시판 선택 가능
  - 게시판 ID 매핑: praise(칭찬합시다), policy(정책연구/제안)
  - 목록 페이지: BeautifulSoup로 파싱, onclick 속성에서 게시글 ID 추출
  - 상세 페이지: 별도 요청으로 본문 수집
  - 데이터: 제목, 내용, 작성자, 게시 날짜, 조회수, 댓글수
  - source_id: "ca_" + 게시글 ID
  - 중복 체크: source_id 기반
  - 1.0초 최소 간격 rate limiting

- **dcinside.py**: 디시인사이드 천안 마이너갤러리 (gallery_id="cheonan")
  - `DCInsideCrawler(max_pages=5)`: 최대 크롤링 페이지 수
  - 목록: 광고/공지 제외 (숫자가 아닌 번호)
  - 상세 페이지: 텍스트만 추출 (이미지 태그 제거)
  - 데이터: 제목, 내용, 닉네임, 게시 날짜, 게시글 URL
  - source_id: "dc_cheonan_" + 게시글 번호
  - 중복 체크: source_id 기반
  - 1.5초 최소 간격 rate limiting

- **naver_blog.py**: 네이버 블로그 검색 API
  - `NaverBlogCrawler(queries=["천안", ...], display=100, max_start=1000)`: 검색 키워드, 페이지당 항목, 최대 시작 위치
  - 기본 검색어: "천안", "천안시", "안서동", "천안 맛집", "천안 카페"
  - 데이터: 제목, 설명(요약), 블로거명, 게시 날짜, 블로그 URL
  - source_id: 블로그 포스트 링크 (URL)
  - 중복 제거: 링크 기반 in-memory 중복 제거
  - HTML 태그 제거, HTML 엔티티 디코딩
  - 1.0초 최소 간격 rate limiting

### Common Patterns
- **BeautifulSoup Parsing**: CSS selector로 요소 선택 (.select_one(), .select())
- **HTML/Entity Cleanup**: HTML 태그 제거, &amp; 등 특수문자 디코딩
- **Date Parsing**: 다양한 포맷 지원 (YYYY-MM-DD, YYYY.MM.DD, YYYY-MM-DD HH:MM:SS, YYYYMMDD)
- **Session Management**: requests.Session 사용, User-Agent 헤더 포함
- **Duplicate Handling**: source_id 또는 링크 기반 중복 제거
- **Rate Limiting**: API/웹 크롤링 모두 최소 간격 적용

## Dependencies

### Internal
- `crawler.base.BaseCrawler` — 모든 크롤러의 부모 클래스
- `crawler.common.rate_limiter.RateLimiter` — 요청 간격 제어

### External
- `requests` — HTTP 요청
- `beautifulsoup4` — HTML/XML 파싱
- `sqlalchemy` — ORM, 데이터베이스 세션
- `backend.config.settings` — API 키 설정 (naver_client_id, naver_client_secret)
- `backend.models.post.Post` — 게시글 ORM 모델
- `re` — 정규표현식 (ID 추출, HTML 태그 제거)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
