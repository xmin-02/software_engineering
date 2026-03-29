import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

// 사이드바 네비게이션 항목 목록
const navItems = [
  { to: '/', label: '대시보드', end: true },
  { to: '/places', label: '맛집/카페' },
  { to: '/events', label: '관광/명소' },
  { to: '/youth', label: '청년' },
  { to: '/college', label: '대학생' },
  { to: '/jobs', label: '채용' },
  { to: '/family', label: '가족' },
];

export default function Layout() {
  // 모바일 사이드바 열림/닫힘 상태
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="layout">
      {/* 모바일 오버레이 — 사이드바 외부 클릭 시 닫기 */}
      {menuOpen && (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <h2>천안 대시보드</h2>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link--active' : 'nav-link'
              }
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="content-area">
        <header className="top-bar">
          {/* 모바일에서만 표시되는 햄버거 버튼 */}
          <button
            className="menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="메뉴 열기/닫기"
          >
            ☰
          </button>
          <div className="top-bar-title">천안 지역 여론 분석 & 생활 정보</div>
          <div className="top-bar-info">
            <span className="status-dot" />
            <span>실시간 운영 중</span>
          </div>
        </header>
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
