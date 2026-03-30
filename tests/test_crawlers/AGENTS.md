<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# test_crawlers

## Purpose
웹 크롤러의 유닛 테스트. Naver Blog, DCInside, Cheonan City Hall, Places 크롤러의 HTML 파싱, API 응답 처리, 데이터 검증을 다룬다.

## Key Files
| File | Description |
|------|-------------|
| __init__.py | 패키지 마커 |
| test_naver_blog.py | NaverBlogCrawler 테스트 (HTML 정제, API 응답 파싱, 포스트 생성 검증) |
| test_dcinside.py | DCInsideCrawler 테스트 (BeautifulSoup 파싱, 댓글 추출 등) |
| test_cheonan_city.py | CheonanCityCrawler 테스트 (시청 공지사항 파싱) |
| test_places.py | PlacesCrawler 테스트 (장소 검색, 리뷰 수집 등) |

## For AI Agents

### Working In This Directory
이 디렉토리에서 작업할 때는:
- **모의 객체**: `unittest.mock` (patch, MagicMock)로 실제 API 호출 방지.
- **Fixture**: pytest fixture로 샘플 API 응답, HTML 문자열 관리.
- **테스트 패턴**: 단위 테스트(메서드별) + 통합 테스트(전체 크롤 흐름).
- **어써션**: 반환 데이터 구조, 필드 존재 여부, 값 유효성 검증.
- **테스트 실행**: `pytest tests/test_crawlers/` 또는 개별 테스트 파일 지정.

### Common Test Patterns
- **HTML 정제**: `_clean_html()` 메서드 검증 (태그 제거, 엔티티 디코딩, 공백 정리)
- **API 응답 파싱**: 실제 API 응답 구조 모의화 → 크롤러가 올바르게 파싱하는지 확인
- **데이터 변환**: 포스트/리뷰 객체의 필드 검증 (id, title, content, author, published_at 등)
- **예외 처리**: 잘못된 응답, 네트워크 오류, 타임아웃 상황 테스트
- **정규표현식**: URL 추출, 날짜 파싱 등의 정규식 검증

### Example Test Structure
```python
from unittest.mock import patch, MagicMock
import pytest
from crawler.opinion.naver_blog import NaverBlogCrawler

@pytest.fixture
def crawler():
    return NaverBlogCrawler(queries=["천안"], display=5, max_start=6)

@pytest.fixture
def mock_api_response():
    return {
        "items": [
            {
                "title": "<b>천안</b> 맛집",
                "link": "https://blog.naver.com/test/1001",
                "postdate": "20260317",
                # ...
            }
        ]
    }

def test_clean_html(crawler):
    """HTML 태그 제거 검증"""
    assert crawler._clean_html("<b>천안</b>") == "천안"

def test_crawl_parses_response(crawler, mock_api_response):
    """API 응답 파싱 검증"""
    # mock requests.get → API 응답 시뮬레이션
    # crawler.crawl() 호출
    # 반환 데이터 검증
    pass
```

## Test Coverage Goals
- **Naver Blog**: 쿼리 조합, HTML 정제, 날짜 파싱, 포스트 객체 생성
- **DCInside**: 갤러리 URL 생성, HTML 추출, 스크래핑 오류 처리
- **Cheonan City**: 공지사항 파싱, 카테고리 분류
- **Places**: Naver/Kakao 검색, 리뷰 병합, 태그 추출

## Dependencies

### Internal
- `crawler.opinion.naver_blog` — Naver Blog 크롤러
- `crawler.opinion.dcinside` — DCInside 크롤러
- `crawler.opinion.cheonan_city` — Cheonan City Hall 크롤러
- `crawler.places.*` — Places 크롤러

### External
- `pytest` — 테스트 프레임워크
- `unittest.mock` — 모의 객체 (patch, MagicMock)
- `requests` (mocked) — HTTP 요청 라이브러리
- `beautifulsoup4` (mocked) — HTML 파싱

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
