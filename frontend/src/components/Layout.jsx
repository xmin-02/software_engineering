import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3, UtensilsCrossed, MapPin, GraduationCap,
  BookOpen, Briefcase, Users,
} from 'lucide-react';
import './Layout.css';

const navItems = [
  { to: '/', label: '대시보드', Icon: BarChart3, accent: 'var(--color-dashboard)', end: true },
  { to: '/places', label: '맛집/카페', Icon: UtensilsCrossed, accent: 'var(--color-places)' },
  { to: '/events', label: '관광/명소', Icon: MapPin, accent: 'var(--color-events)' },
  { to: '/youth', label: '청년', Icon: GraduationCap, accent: 'var(--color-youth)' },
  { to: '/college', label: '대학생', Icon: BookOpen, accent: 'var(--color-college)' },
  { to: '/jobs', label: '채용', Icon: Briefcase, accent: 'var(--color-jobs)' },
  { to: '/family', label: '가족', Icon: Users, accent: 'var(--color-family)' },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="layout">
      {menuOpen && (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">天</span>
          <div>
            <h2>천안 대시보드</h2>
            <p className="sidebar-subtitle">지역 여론 & 생활 정보</p>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="메인 네비게이션">
          {navItems.map(({ to, label, Icon, accent, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? 'nav-link nav-link--active' : 'nav-link'
              }
              style={({ isActive }) =>
                isActive ? { '--nav-accent': accent } : undefined
              }
              onClick={() => setMenuOpen(false)}
            >
              <Icon size={20} strokeWidth={1.8} className="nav-icon" />
              <span className="nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-version">v1.0</span>
        </div>
      </aside>

      <div className="content-area">
        <header className="top-bar">
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
