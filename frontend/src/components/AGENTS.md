<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-30 | Updated: 2026-03-30 -->

# components

## Purpose
애플리케이션의 공통 레이아웃 컴포넌트. 사이드바, 상단 내비게이션, 메인 콘텐츠 영역, 모바일 반응형 기능을 포함한 전체 페이지 구조를 정의합니다. 모든 페이지가 이 Layout을 감싸서 사용합니다.

## Key Files
| File | Description |
|------|-------------|
| `Layout.jsx` | React Router 기반 래이아웃 - 사이드바 내비게이션, 상단바, 콘텐츠 영역, 모바일 메뉴 토글 |
| `Layout.css` | 사이드바/상단바/콘텐츠 영역 스타일, 모바일 반응형 (768px 이하) 레이아웃 |

## For AI Agents

### Working In This Directory
Layout은 모든 페이지의 외적 구조를 담당합니다. 추가 작업 시 고려사항:
1. **내비게이션 항목 추가**: `Layout.jsx`의 `navItems` 배열에 `{ to, label, end }` 객체 추가
2. **스타일 변경**: 데스크톱/모바일 브레이크포인트는 768px (Layout.css 하단의 @media query 참조)
3. **모바일 메뉴**: `menuOpen` 상태로 사이드바 오버레이 열기/닫기 - 링크 클릭 시 자동으로 메뉴 닫힘

### Common Patterns
- **NavLink active**: React Router의 `end` prop으로 정확한 경로 매칭 (홈의 경우 `end: true`)
- **모바일 토글**: `menuOpen` 상태 관리 - 햄버거 버튼과 오버레이 클릭으로 제어
- **Outlet**: `<Outlet />` 내부에 페이지별 컴포넌트(DashboardPage, JobsPage 등) 렌더링
- **CSS 클래스**: `.sidebar.open`, `.nav-link--active` 등 상태별 클래스 활용

## Dependencies

### Internal
- 없음 (최상위 구조 컴포넌트)

### External
- React: useState, Outlet, NavLink (react-router-dom)

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
