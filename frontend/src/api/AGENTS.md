<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# api

## Purpose
프론트엔드 애플리케이션의 HTTP 클라이언트 설정. 백엔드 API와 통신하는 모든 요청의 기본 설정(baseURL, timeout, 헤더)을 한 곳에서 관리하는 axios 인스턴스를 제공합니다.

## Key Files
| File | Description |
|------|-------------|
| `client.js` | 환경 변수 기반 baseURL 설정, 타임아웃 10초, JSON 헤더를 갖춘 axios 인스턴스 |

## For AI Agents

### Working In This Directory
프로젝트 전역 API 통신은 이 `client.js`의 `api` 인스턴스를 import해서 사용합니다. 새로운 HTTP 요청 포인트 추가 시:
1. 모든 페이지/컴포넌트에서 `import api from '../api/client'` 사용
2. `api.get(url, { params })`, `api.post(url, data)` 등 표준 axios 패턴 사용
3. 공통 설정 변경 필요 시 이 파일만 수정

### Common Patterns
- **baseURL**: `VITE_API_URL` 환경 변수 또는 `http://localhost:8000` (개발 환경)
- **timeout**: 모든 요청 10초 타임아웃
- **Content-Type**: 항상 `application/json`
- **에러 처리**: 호출 컴포넌트에서 try-catch로 처리

## Dependencies

### Internal
- 없음 (이 파일이 가장 하위 레벨)

### External
- axios: HTTP 클라이언트 라이브러리
- Vite: `import.meta.env` 환경 변수 접근

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
