<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# test

## Purpose
Cloudflare Workers API의 유닛 테스트. Vitest 및 Cloudflare 테스트 유틸리티를 사용하여 Hono 워커의 요청/응답을 검증한다.

## Key Files
| File | Description |
|------|-------------|
| index.spec.js | 기본 헬스 체크 엔드포인트 테스트 (유닛 스타일, 통합 스타일) |

## For AI Agents

### Working In This Directory
이 디렉토리에서 작업할 때는:
- **테스트 작성**: vitest + cloudflare:test 유틸리티 사용. `describe` + `it` 패턴.
- **테스트 실행**: `npm test` 또는 `npm run test` (wrangler.toml에 설정됨).
- **Request/Response**: `new Request()` + `worker.fetch()` 조합으로 요청 시뮬레이션.
- **실행 컨텍스트**: `createExecutionContext()` + `waitOnExecutionContext()` 사용으로 비동기 작업 완료 대기.
- **Assertion**: vitest의 `expect()` API로 응답 검증.

### Common Patterns
- **유닛 테스트**: 직접 `worker.fetch()` 호출. 모의 요청 객체 생성.
- **통합 테스트**: `SELF.fetch()` 사용으로 실행 중인 워커에 요청.
- **비동기 대기**: `waitOnExecutionContext()` 반드시 호출하여 Promise 완료 확인.
- **응답 검증**: `response.text()`, `response.json()` 등으로 본문 추출 후 검증.
- **스냅샷**: `toMatchInlineSnapshot()`으로 응답 형식 검증.

## Dependencies

### Internal
- `../src/index.js` — 메인 워커 로직

### External
- `vitest` — 테스트 프레임워크
- `cloudflare:test` — Cloudflare Workers 테스트 유틸리티 (env, createExecutionContext, waitOnExecutionContext, SELF)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
