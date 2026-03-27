import { NavLink, Outlet } from 'react-router-dom';
import './Layout.css';

// 사이드바 네비게이션 항목 목록
const navItems = [
  { to: '/', label: '대시보드', end: true },
  { to: '/places', label: '맛집/카페' },
  { to: '/events', label: '행사/축제' },
  { to: '/youth', label: '청년' },
  { to: '/college', label: '대학생' },
  { to: '/jobs', label: '채용' },
  { to: '/family', label: '가족' },
];

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
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
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
