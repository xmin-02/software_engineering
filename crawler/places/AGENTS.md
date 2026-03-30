<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# places

## Purpose
천안의 맛집, 카페 등 음식점 및 시설 정보와 리뷰를 수집합니다. 네이버 지역 검색 API, 카카오 장소 검색 API, 네이버 블로그 리뷰를 통합 관리합니다.

## Key Files
| File | Description |
|------|-------------|
| `__init__.py` | 모듈 진입점 |
| `naver_place.py` | 네이버 지역 검색 API 기반 장소 메타데이터 크롤러 (NaverPlaceCrawler) |
| `kakao_place.py` | 카카오 장소 검색 API 기반 장소 메타데이터 크롤러 (KakaoPlaceCrawler) |
| `blog_review.py` | 네이버 블로그 검색 API 기반 맛집/카페 리뷰 크롤러 (BlogReviewCrawler) |

## For AI Agents

### Working In This Directory
- **naver_place.py**: 네이버 지역 검색 API
  - `NaverPlaceCrawler(queries=[...], display=5, max_start=46)`: 검색 키워드, 페이지당 항목, 최대 시작 위치
  - 기본 검색어: 한식/양식/일식/중식/디저트/술집/분식 관련 "천안" 검색어
  - 데이터: 장소명, 카테고리(대/소분류), 주소, 전화, 좌표(위경도), 술집 여부
  - 좌표 변환: 네이버 카텍 좌표 → WGS84 위경도 (근사 변환)
  - 중복 제거: 장소명 + 주소 조합 기반
  - 천안 지역 필터링: "천안" 포함된 주소만 저장
  - 1.0초 최소 간격 rate limiting

- **kakao_place.py**: 카카오 장소 검색 API
  - `KakaoPlaceCrawler(queries=[...], size=15, max_page=3)`: 검색 키워드, 페이지당 항목, 최대 페이지
  - 동일 검색 키워드 (네이버 플레이스와 동일)
  - 데이터: 장소명, 카테고리(대/소분류), 주소, 전화, 좌표(WGS84), 술집 여부, 카카오 ID
  - 카테고리 추출: > 구분자로 대/소분류 파싱
  - 중복 제거: 장소명 + 주소 조합 기반
  - 천안 지역 필터링: "천안" 포함된 주소만 저장
  - 기존 장소 업데이트: 이름+주소 일치 시 카카오 정보 병합 (ID, 전화, 좌표)
  - 0.5초 최소 간격 rate limiting

- **blog_review.py**: 네이버 블로그 검색 API 기반 리뷰 수집
  - `BlogReviewCrawler(display=10, max_start=11)`: 페이지당 항목, 최대 시작 위치
  - 모든 Place 레코드에 대해 "천안 {장소명} 후기" 검색
  - 데이터: place_id, 리뷰 텍스트, 리뷰 URL, 게시 날짜, source("naver_blog")
  - 중복 제거: review_url 기반
  - HTML 태그 제거, HTML 엔티티 디코딩
  - 1.0초 최소 간격 rate limiting

### Common Patterns
- **Coordinate Conversion**: 네이버 카텍 좌표를 WGS84로 근사 변환
- **Category Extraction**: > 또는 > 구분자로 대/소분류 파싱
- **Deduplication**: 이름 + 주소 조합으로 중복 제거
- **Region Filtering**: "천안" 포함된 주소만 저장
- **Alcohol Detection**: 키워드 기반 술집/바 분류
- **Merge Strategy**: 동일 장소에 다른 API의 데이터 병합 (카카오 → 네이버 등)

## Dependencies

### Internal
- `crawler.base.BaseCrawler` — 모든 크롤러의 부모 클래스
- `crawler.common.rate_limiter.RateLimiter` — 요청 간격 제어

### External
- `requests` — HTTP JSON API 요청
- `sqlalchemy` — ORM, 데이터베이스 세션
- `backend.config.settings` — API 키 설정 (naver_client_id, naver_client_secret, kakao_rest_api_key)
- `backend.models.place.Place` — 장소 정보 ORM 모델
- `backend.models.place.PlaceReview` — 장소 리뷰 ORM 모델
- `backend.database.SessionLocal` — DB 세션 팩토리 (blog_review에서만 사용)
- `re` — 정규표현식 (HTML 태그 제거)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
