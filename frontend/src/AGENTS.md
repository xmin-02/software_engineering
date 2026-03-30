<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# src

## Purpose
React 프론트엔드 애플리케이션의 진입점 및 핵심 라우팅 로직. 천안 지역 대시보드, 맛집/카페 정보, 관광 명소, 청년/대학생/채용/가족 콘텐츠 페이지로의 라우팅을 처리하며, 반응형 레이아웃과 사이드바 네비게이션을 제공한다.

## Key Files
| File | Description |
|------|-------------|
| App.jsx | React Router 설정 및 7개 페이지(대시보드, 맛집/카페, 관광, 청년, 대학생, 채용, 가족)로의 라우팅 정의 |
| main.jsx | Vite 진입점, React StrictMode로 App 마운트 |
| index.css | 전역 스타일 초기화 (border-box, 마진/패딩 제거), 폰트 설정, root div 높이 100vh |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| api/ | API 클라이언트 및 서버 통신 로직 |
| assets/ | 정적 이미지 파일 (hero.png, vite.svg) |
| components/ | 공유 UI 컴포넌트 (Layout, 사이드바 네비게이션) |
| pages/ | 연령대 및 카테고리별 페이지 컴포넌트 (Dashboard, Places, Events, Youth, College, Jobs, Family) |

## For AI Agents

### Working In This Directory
이 디렉토리에서 작업할 때는:
- **App.jsx**: 라우트 추가/삭제 시 여기서 수정. React Router 구조 이해 필수.
- **main.jsx**: 진입점이므로 함부로 수정하지 않기. 모듈 임포트 순서 유지.
- **index.css**: 전역 스타일만 담기. 컴포넌트별 스타일은 각 폴더의 .css 파일에서 관리.
- **페이지 추가**: App.jsx에 라우트 추가 + pages/에 새 컴포넌트 파일 생성 + Layout에 네비 항목 추가 필요.

### Common Patterns
- **라우팅**: BrowserRouter + Routes + Route (index, path 속성 사용)
- **레이아웃**: Layout 컴포넌트가 Outlet으로 하위 페이지 렌더링
- **네비게이션**: NavLink 컴포넌트로 현재 경로 표시 (isActive 클래스)
- **상태 관리**: 각 페이지에서 useState + useEffect로 로컬 상태 관리
- **API 호출**: api/client.js를 통한 중앙 집중식 서버 통신

## Dependencies

### Internal
- `./components/Layout` — 레이아웃 구조 및 사이드바
- `./pages/*` — 7개 페이지 컴포넌트
- `./api/client` — API 통신 클라이언트

### External
- `react` (v18+), `react-dom` — UI 레이더링
- `react-router-dom` — 클라이언트 라우팅 (BrowserRouter, Routes, Route, NavLink, Outlet)
- `recharts` — 데이터 시각화 (차트, 그래프)
- Vite — 빌드 도구 (main.jsx가 Vite 진입점)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
