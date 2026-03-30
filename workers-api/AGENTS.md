<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# workers-api

## Purpose
Cloudflare Workers 환경에서 실행되는 REST API 서버 구현. PostgreSQL 또는 SQLite 데이터베이스에서 여론 분석, 맛집 정보, 콘텐츠(채용, 행사, 장학금 등) 데이터를 조회하여 JSON으로 응답하는 Hono 웹 프레임워크 기반 API 게이트웨이 역할을 한다.

## Key Files
| File | Description |
|------|-------------|
| package.json | 프로젝트 메타데이터, 의존성 (hono, vitest, wrangler), NPM 스크립트 (dev, deploy, test) |
| src/index.js | Hono 애플리케이션 진입점: CORS 설정, /api/posts, /api/stats/*, /api/topics, /api/places, /api/jobs, /api/events 등 20+ 엔드포인트 정의 |
| schema.sql | SQLite 스키마 정의 (posts, analysis, places, place_reviews, place_tags, events, jobs, real_estate, scholarships, contests, university_notices, certifications 등 12개 테이블) |
| seed.sql | SQLite 초기 데이터 로드 스크립트 (테스트/개발 용도) |
| test/index.spec.js | Vitest 기반 API 엔드포인트 단위 테스트 |
| vitest.config.js | Vitest 설정 (@cloudflare/vitest-pool-workers 사용) |
| wrangler.jsonc | Cloudflare Workers 배포 설정 (바인딩, 환경 변수, D1 데이터베이스 리소스) |
| .editorconfig | EditorConfig 설정 (코드 스타일 일관성) |
| .prettierrc | Prettier 포매팅 설정 |
| .gitignore | Git 무시 파일 목록 |

## Subdirectories (if any)
None. (node_modules는 .gitignore에 포함)

## For AI Agents

### Working In This Directory
- **엔드포인트 추가/수정**: src/index.js에서 Hono 라우터 정의. GET 요청 필터링(source, sentiment, date_from, date_to, category, age_group 등) 구현.
- **쿼리 최적화**: SQLite/PostgreSQL 쿼리 직접 작성. 페이지네이션(LIMIT, OFFSET), 그룹화, 조인 등 성능 최적화.
- **데이터베이스 스키마 변경**: schema.sql 수정 후 wrangler.jsonc의 바인딩 업데이트. 마이그레이션 관리는 Cloudflare D1 문서 참조.
- **CORS 및 인증**: cors() 미들웨어 설정, X-API-Key 헤더 검증(필요시 추가).
- **응답 포맷**: JSON 응답에서 배열, JSON 문자열(keywords, business_hours, sentiment_ratio)을 올바른 타입으로 파싱.

### Testing Requirements
코드 변경 후 다음을 확인합니다:
- **로컬 개발 테스트**: `npm run dev`로 로컬 Cloudflare Workers 시뮬레이터 실행, curl이나 Postman으로 엔드포인트 테스트
  - 예: `curl "http://localhost:8787/api/posts?source=naver_blog&sentiment=positive&page=1&size=10"`
- **단위 테스트**: `npm test`로 Vitest 실행, 모든 테스트 통과 확인
- **데이터베이스 쿼리**: SQLite 쿼리 문법 검증 (PostgreSQL과 일부 차이 있음, 예: date() vs DATE())
- **페이지네이션**: 대량 데이터(>1000건)에서 LIMIT/OFFSET 성능 검증
- **응답 일관성**: 배열 요소 중 JSON 문자열(keywords, business_hours)이 올바르게 파싱되는지 확인

## Dependencies

### Internal
- db/init.sql (PostgreSQL 버전): 원본 스키마. workers-api/schema.sql은 SQLite 변형
- backend/routes/ (FastAPI): API 설계 참고, 엔드포인트 명세 일관성 확보

### External
- **Hono** (4.12.9): 경량 웹 프레임워크 (Cloudflare Workers 최적화)
- **Cloudflare Workers**: 호스트 인프라 (D1 데이터베이스 바인딩)
- **Cloudflare D1**: SQLite 기반 서버리스 데이터베이스
- **Vitest** (3.2.0): 테스트 프레임워크
- **Wrangler** (3.101.0): Cloudflare Workers 배포 CLI

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
