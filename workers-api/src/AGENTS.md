<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# src

## Purpose
Cloudflare Workers에서 실행되는 REST API 서버의 메인 로직. Hono 프레임워크를 사용하여 포스트, 장소, 이벤트, 청년/대학생/취업/가족 관련 콘텐츠 엔드포인트를 제공한다. D1(SQLite) 데이터베이스와 CORS를 지원한다.

## Key Files
| File | Description |
|------|-------------|
| index.js | Hono 앱 설정 및 16개 API 엔드포인트 구현 (대시보드, 장소, 콘텐츠, 통계, 검색 기능) |

## For AI Agents

### Working In This Directory
이 디렉토리에서 작업할 때는:
- **index.js**: 모든 라우트가 이 파일에 정의됨. 엔드포인트 추가/수정 시 여기서만 작업.
- **CORS**: 이미 활성화됨 (`app.use('*', cors())`). 프론트엔드 호출 가능 상태.
- **D1 바인딩**: `c.env.DB`로 D1 데이터베이스 접근. wrangler.toml에서 바인딩 설정 확인 필요.
- **쿼리 파라미터**: `c.req.query()`로 GET 파라미터 추출. 페이지네이션은 offset/limit 기반.
- **필터**: WHERE 절 동적 생성 패턴 사용. 파라미터 바인딩으로 SQL 인젝션 방지.

### Common Patterns
- **엔드포인트**: GET 메서드만 사용 (읽기 전용 API). `app.get('/path', handler)` 형태.
- **응답**: `c.json()` 사용. 에러는 상태 코드 + error 객체로 반환.
- **페이지네이션**: page/size 파라미터 → offset/limit 계산 → COUNT(*) 쿼리로 총 건수 조회.
- **JSON 직렬화**: keywords, business_hours, top_topics, sentiment_ratio는 DB에 JSON 문자열로 저장 → JSON.parse()로 복원.
- **LEFT JOIN**: posts-analysis, places-place_reviews 같은 관계 테이블과 JOIN.
- **필터링**: 선택적 필터는 배열 기반 WHERE 절 동적 구성 → params 배열로 바인딩.

## API Endpoints Summary
| Method | Path | Purpose |
|--------|------|---------|
| GET | /health | 서버 상태 확인 |
| GET | /api/posts | 포스트 목록 (소스, 감성, 날짜 필터) |
| GET | /api/stats/sentiment | 감성 통계 (긍정/부정/중립 집계) |
| GET | /api/stats/trend | 감성 추이 (일/주 단위) |
| GET | /api/stats/sources | 출처별 감성 통계 |
| GET | /api/topics | 주요 토픽 (기간별, 상위 15개) |
| GET | /api/topics/:id/posts | 토픽별 포스트 (최대 50개) |
| GET | /api/keywords | 키워드 빈도 (스팸 필터링, 상위 N개) |
| GET | /api/summaries | 주간 요약 (상위 10개) |
| GET | /api/places | 장소 목록 (카테고리, 연령대 필터, 태그) |
| GET | /api/places/ranking | 장소 순위 (감성 점수 기반) |
| GET | /api/places/:id | 장소 상세 + 리뷰 + 태그 |
| GET | /api/events | 이벤트 목록 |
| GET | /api/youth/university-notices | 대학 공지사항 |
| GET | /api/college/* | 대학생 콘텐츠 (공모전, 장학금, 주택) |
| GET | /api/jobs | 채용 공고 |
| GET | /api/certifications | 자격증 정보 |
| GET | /api/family/real-estate | 부동산 정보 |

## Dependencies

### Internal
(없음 — 단일 파일)

### External
- `hono` — REST API 프레임워크 (경량, Cloudflare Workers 최적화)
- `hono/cors` — CORS 미들웨어
- Cloudflare D1 — SQLite 데이터베이스 (c.env.DB로 접근)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
