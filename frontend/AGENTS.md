<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# frontend

## Purpose

React + Vite 기반의 천안 지역 여론 분석 및 생활 정보 대시보드 프론트엔드. 감성 분석, 장소 정보, 행사 정보, 채용 정보 등을 연령대별(청년, 대학생, 채용, 가족)로 시각화하고 제공하는 사용자 인터페이스 계층. Recharts를 활용한 실시간 차트 시각화, Kakao Maps 연동, axios 기반 API 통신을 지원한다.

## Key Files

| File | Description |
|------|-------------|
| `package.json` | npm 의존성 정의 (React 19, Vite, Recharts, axios, react-router-dom) |
| `vite.config.js` | Vite 빌드 설정 (React 플러그인 활성화) |
| `eslint.config.js` | ESLint 규칙 설정 (React Hooks, Refresh 플러그인 포함) |
| `index.html` | HTML 진입점 (Kakao Maps SDK 로드, root 컨테이너) |
| `src/main.jsx` | React 애플리케이션 부트스트랩 |
| `src/App.jsx` | 라우팅 설정 (레이아웃 + 7개 페이지) |
| `src/index.css` | 전역 스타일 (box-sizing, 기본 폰트) |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `public/` | 정적 자산 (favicon, 아이콘, 리다이렉트 규칙) |
| `src/` | React 소스 코드 (see `src/AGENTS.md`) |
| `src/pages/` | 라우트별 페이지 컴포넌트 (대시보드, 맛집, 행사, 청년, 대학, 채용, 가족) |
| `src/components/` | 공유 컴포넌트 (레이아웃, 네비게이션, 모달) |

## For AI Agents

### Working In This Directory

- **빌드 및 개발**: `npm install` → `npm run dev` (localhost:5173)
- **린트**: `npm run lint` (ESLint 규칙 검사)
- **프로덕션 빌드**: `npm run build` → `dist/` 생성
- **API 통신**: `src/api/client.js`에서 axios 인스턴스 사용 (기본 URL, 에러 핸들링)
- **라우팅**: `react-router-dom`의 `<BrowserRouter>`, `<Routes>`, `<Route>` 사용
- **상태 관리**: React 내장 `useState`, `useEffect`, `useCallback` 사용 (외부 상태관리 라이브러리 없음)
- **스타일링**: CSS 모듈이 아닌 일반 CSS 파일 사용 (페이지별/컴포넌트별 분리)
- **지도 기능**: Kakao Maps SDK (window.kakao) 직접 사용, 비동기 로드 처리
- **차트 시각화**: Recharts (PieChart, LineChart, BarChart, ResponsiveContainer 등)

### Testing Requirements

- 로컬 개발 서버에서 각 페이지 접근 가능 확인
- API 통신 시뮬레이션 (mock API 또는 백엔드 실행 필요)
- Kakao Maps 좌표 표시 확인 (위도/경도 필수)
- 모바일 반응형 레이아웃 검사 (사이드바 토글, 햄버거 메뉴)
- ESLint 패스: `npm run lint`
- 브라우저 콘솔에서 에러/경고 없음

### Common Patterns

- **페이지 구조**: 제목 + 필터/탭 + 데이터 그리드/테이블 + 페이지네이션
- **에러 핸들링**: `Promise.allSettled()` 사용, 개별 API 실패 시에도 부분 렌더링
- **로딩 상태**: 단일 `loading` 불린과 `errors` 객체로 각 API 결과 추적
- **필터링**: `useState`로 필터 상태 관리, 변경 시 `page` 초기화
- **감성 시각화**: 양방향 바 (SentimentDualBar) 또는 배지 (SentimentBadge)
- **모달**: 오버레이 클릭 / ESC 키로 닫기, 스크롤 잠금 (body overflow)
- **지도 초기화**: `kakao.maps.load()` 콜백 사용, 비동기 로드 완료 후 마커 생성
- **반응형**: 모바일에서 사이드바 숨김 + 토글 버튼, 데스크톱에서 고정 사이드바

## Dependencies

### Internal

- `src/api/client` — axios 기반 API 클라이언트 (백엔드와 통신)
- `src/pages/*Page.jsx` — 각 라우트별 페이지 (see `src/AGENTS.md`)
- `src/components/Layout.jsx` — 레이아웃 + 네비게이션 바

### External

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19.2.4 | UI 라이브러리 |
| `react-dom` | ^19.2.4 | DOM 렌더링 |
| `react-router-dom` | ^7.13.2 | 클라이언트 라우팅 |
| `recharts` | ^3.8.1 | 차트 시각화 (pie, line, bar 등) |
| `axios` | ^1.13.6 | HTTP 클라이언트 |
| `vite` | ^8.0.1 | 빌드 도구 |
| `@vitejs/plugin-react` | ^6.0.1 | Vite React 플러그인 |
| `eslint` | ^9.39.4 | 코드 린트 |
| `eslint-plugin-react-hooks` | ^7.0.1 | React Hooks ESLint 규칙 |
| `eslint-plugin-react-refresh` | ^0.5.2 | React Fast Refresh 규칙 |

## Deployment

- **호스팅**: Cloudflare Pages (자동 빌드)
- **빌드 명령**: `npm run build`
- **출력 디렉토리**: `dist/`
- **환경 변수**: `.env` 파일 (API_URL 등, 절대 커밋 금지)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
