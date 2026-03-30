<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# crawler

## Purpose
천안시 관련 다양한 데이터 소스에서 구조화된 정보를 수집하는 웹 크롤러 모음. BaseCrawler 추상 클래스를 상속받아 각 크롤러가 독립적으로 데이터를 수집, 정제, DB 저장한다. Naver API, Kakao API, data.go.kr API, BeautifulSoup 기반 스크래핑을 활용하며 RateLimiter로 요청 제한을 준수한다.

## Key Files
| File | Description |
|------|-------------|
| `base.py` | 모든 크롤러의 기반 추상 클래스. `crawl()`, `save()`, `run()` 메서드 정의. DB 커밋/롤백 처리 포함 |
| `__init__.py` | 크롤러 패키지 초기화 (현재 비어있음) |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `common/` | 크롤러 공통 유틸리티. RateLimiter, 실시간 부동산 데이터 (see `common/AGENTS.md`) |
| `opinion/` | 여론/맛집 리뷰 데이터. Naver Blog, DCInside, 천안시청 (see `opinion/AGENTS.md`) |
| `places/` | 식당/카페 메타데이터. Naver Place, Kakao Place, 블로그 리뷰 (see `places/AGENTS.md`) |
| `jobs/` | 채용 정보. 워크넷(work24) API (see `jobs/AGENTS.md`) |
| `events/` | 문화행사/축제. data.go.kr API (see `events/AGENTS.md`) |
| `youth/` | 대학생 공지사항 및 장학금. 대학 웹사이트, KOSAF (see `youth/AGENTS.md`) |

## For AI Agents

### Working In This Directory

1. **BaseCrawler 상속**: 새 크롤러는 반드시 `BaseCrawler`를 상속하고 `crawl()`, `save()` 메서드 구현
2. **데이터 정제**: `crawl()`에서 HTML 태그 제거, 불필요한 공백 정제, 날짜 포맷 통일
3. **중복 제거**: DB 저장 전 기존 데이터와 중복 여부 확인 (URL 기반 또는 해시 기반)
4. **RateLimiter 사용**: API 호출 시 반드시 `RateLimiter` 적용하여 ToS 준수
5. **예외 처리**: `run()` 메서드가 DB 롤백 처리하므로 `crawl()`과 `save()`에서만 예외 발생 가능
6. **타입 힌트**: 모든 메서드에 PEP 484 타입 힌트 작성
7. **Docstring**: 크롤러 클래스와 주요 메서드에 한글 설명 작성

### Testing Requirements

```bash
# 단위 테스트 실행 (pytest)
pytest crawler/ -v

# 특정 크롤러만 테스트
pytest crawler/opinion/test_naver_blog.py -v

# 실제 API 테스트 (선택적, .env 필요)
pytest crawler/opinion/test_naver_blog.py --integration
```

테스트 시 주의사항:
- Mock API 응답 사용 (실제 API 호출 최소화)
- DB 커밋 전 롤백 보장
- Rate limiting이 정상 작동하는지 확인
- 데이터 정제 함수가 모든 엣지 케이스 처리하는지 검증

### Common Patterns

**패턴 1: API 기반 크롤러**
```python
from crawler.base import BaseCrawler
from crawler.common.rate_limiter import RateLimiter

class MyAPIcrawler(BaseCrawler):
    def __init__(self):
        super().__init__(source="my_api_source")
        self.rate_limiter = RateLimiter(min_interval=1.0)

    def crawl(self):
        data = []
        for query in SEARCH_QUERIES:
            self.rate_limiter.wait()
            response = requests.get(API_URL, params={"q": query})
            # 정제 로직
            data.extend(items)
        return data

    def save(self, data, db):
        count = 0
        for item in data:
            # 중복 확인
            if not db.query(Model).filter_by(url=item["url"]).first():
                db.add(Model(**item))
                count += 1
        return count
```

**패턴 2: BeautifulSoup 기반 스크래퍼**
```python
from bs4 import BeautifulSoup

def crawl(self):
    response = requests.get(TARGET_URL, headers=HEADERS)
    soup = BeautifulSoup(response.content, "html.parser")
    items = soup.select("div.item")
    return [self._parse_item(item) for item in items]
```

**패턴 3: XML API (워크넷)**
```python
import xml.etree.ElementTree as ET

def crawl(self):
    response = requests.get(API_URL, params=params)
    root = ET.fromstring(response.content)
    items = root.findall(".//item")
    return [self._parse_xml_item(item) for item in items]
```

## Dependencies

### Internal
- `backend.config.settings` — API 키, DB 설정
- `backend.database.SessionLocal` — DB 세션
- `backend.models.*` — SQLAlchemy ORM 모델 (Post, Place, Event, Job, UniversityNotice)
- `crawler.base.BaseCrawler` — 크롤러 기본 클래스
- `crawler.common.rate_limiter.RateLimiter` — 요청 제한 유틸리티

### External
- `requests` — HTTP 요청 (Naver API, Kakao API, data.go.kr, 일반 API)
- `beautifulsoup4` — HTML/XML 파싱 (대학 웹사이트, DCInside 등)
- `sqlalchemy` — ORM (DB 저장)
- `python-dateutil` — 날짜 파싱
- `konlpy` — 한글 자연어 처리 (필요 시)

### API Keys (.env)
```
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
KAKAO_API_KEY=...
DATA_GO_KR_API_KEY=...
WORK_API_KEY=...
```

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
