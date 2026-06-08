import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, UtensilsCrossed, MapPin, GraduationCap,
  BookOpen, Briefcase, Users, Search, Star, Bell, Languages,
  Type, Grid3X3, Accessibility, School, Pill, Globe2, Home,
  Check, ChevronDown, X, ExternalLink,
} from 'lucide-react';
import './Layout.css';
import logoSymbol from '../assets/brand/cheonan-insight-symbol.png';

const FONT_SCALE_KEY = 'cheonan_font_scale';
const LANGUAGE_KEY = 'cheonan_language';

const LANGUAGES = {
  ko: { label: '한국어', short: 'KO' },
  en: { label: 'English', short: 'EN' },
  zh: { label: '中文', short: 'ZH' },
};

const UI_TEXT = {
  ko: {
    appTitle: '천안 대시보드',
    subtitle: '실시간 데이터',
    live: '실시간 운영 중',
    search: '전체 검색 (시설명, 주소, 전화번호...)',
    favorite: '즐겨찾기',
    notifications: '알림',
    language: '언어 선택',
    font: '글자 크기',
    widgets: '위젯',
  },
  en: {
    appTitle: 'Cheonan Dashboard',
    subtitle: 'Live data',
    live: 'Live operation',
    search: 'Search all (name, address, phone...)',
    favorite: 'Favorites',
    notifications: 'Notifications',
    language: 'Language',
    font: 'Font size',
    widgets: 'Widgets',
  },
  zh: {
    appTitle: '天安仪表板',
    subtitle: '实时数据',
    live: '实时运行中',
    search: '全局搜索（设施名、地址、电话...）',
    favorite: '收藏',
    notifications: '通知',
    language: '语言选择',
    font: '字体大小',
    widgets: '小组件',
  },
};

const navItems = [
  { to: '/', label: '대시보드', Icon: BarChart3, accent: 'var(--color-dashboard)', end: true },
  { to: '/places', label: '맛집 · 카페', Icon: UtensilsCrossed, accent: 'var(--color-places)' },
  { to: '/events', label: '관광', Icon: MapPin, accent: 'var(--color-events)' },
  { to: '/youth', label: '청년', Icon: GraduationCap, accent: 'var(--color-youth)' },
  { to: '/college', label: '대학교', Icon: BookOpen, accent: 'var(--color-college)' },
  { to: '/jobs', label: '일자리', Icon: Briefcase, accent: 'var(--color-jobs)' },
  { to: '/family', label: '가족', Icon: Users, accent: 'var(--color-family)' },
  { to: '/accessibility', label: '무장애 정보', Icon: Accessibility, accent: '#2563eb' },
  { to: '/high-school', label: '고등학생', Icon: School, accent: '#7c3aed' },
  { to: '/medical', label: '의료/약국', Icon: Pill, accent: '#059669' },
  { to: '/foreign-life', label: '외국인 생활', Icon: Globe2, accent: '#0f766e' },
  { to: '/single-household', label: '1인 가구', Icon: Home, accent: '#e11d48' },
];

const pageTitles = {
  '/': '천안 대시보드',
  '/places': '맛집 & 카페',
  '/events': '관광/명소',
  '/youth': '청년',
  '/college': '대학 공지',
  '/jobs': '채용',
  '/family': '가족',
  '/accessibility': '무장애 정보',
  '/high-school': '고등학생',
  '/medical': '의료/약국',
  '/foreign-life': '외국인 생활',
  '/single-household': '1인 가구',
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openPanel, setOpenPanel] = useState(null);
  const [modal, setModal] = useState(null);
  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'ko';
    return localStorage.getItem(LANGUAGE_KEY) || 'ko';
  });
  const [fontScale, setFontScale] = useState(() => {
    if (typeof window === 'undefined') return 'normal';
    return localStorage.getItem(FONT_SCALE_KEY) || 'normal';
  });

  useEffect(() => {
    document.documentElement.dataset.fontScale = fontScale;
    localStorage.setItem(FONT_SCALE_KEY, fontScale);
  }, [fontScale]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.language = language;
    localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  const toggleFontScale = () =>
    setFontScale((v) => (v === 'lg' ? 'normal' : 'lg'));

  const pageTitle = pageTitles[location.pathname] ?? '천안 대시보드';
  const text = UI_TEXT[language] ?? UI_TEXT.ko;
  const togglePanel = (panel) =>
    setOpenPanel((current) => (current === panel ? null : panel));
  const openModal = (type, payload = {}) => {
    setOpenPanel(null);
    setModal({ type, ...payload });
  };
  const selectLanguage = (nextLanguage) => {
    setLanguage(nextLanguage);
    openModal('language', { language: nextLanguage });
  };
  const goTo = (path) => {
    setOpenPanel(null);
    navigate(path);
  };

  return (
    <div className="layout" onClick={() => setOpenPanel(null)}>
      {menuOpen && (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />
      )}

      <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand-card">
            <div className="sidebar-brand-row">
              <div className="sidebar-mini-mark" aria-hidden="true">
                <img src={logoSymbol} alt="" draggable="false" />
              </div>
              <div className="sidebar-brand-copy">
                <h2>천안 인사이트</h2>
                <p className="sidebar-subtitle">시민의 생각이 모여,<br />더 나은 천안으로</p>
              </div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav" aria-label="메인 네비게이션">
          {navItems.map((item) => {
            const IconComponent = item.Icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'nav-link nav-link--active' : 'nav-link'
                }
                style={({ isActive }) =>
                  isActive ? { '--nav-accent': item.accent } : undefined
                }
                onClick={() => setMenuOpen(false)}
              >
                <IconComponent size={20} strokeWidth={1.8} className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button
            type="button"
            className="font-scale-toggle"
            onClick={toggleFontScale}
            aria-pressed={fontScale === 'lg'}
            aria-label={
              fontScale === 'lg' ? '글자 크기 원래대로 줄이기' : '글자 크기 크게 보기'
            }
          >
            {fontScale === 'lg' ? '글자 작게' : '글자 크게'}
          </button>
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
          <div className="top-bar-status">
            <span className="status-dot" />
            <span>{text.live}</span>
          </div>
          <div className="top-search" role="search">
            <Search size={17} strokeWidth={1.8} />
            <span>{text.search}</span>
          </div>
          <div className="top-bar-info">
            <button
              type="button"
              className="top-icon-btn"
              aria-label="즐겨찾기"
              aria-expanded={openPanel === 'favorites'}
              onClick={(e) => { e.stopPropagation(); togglePanel('favorites'); }}
            >
              <Star size={18} fill="#facc15" color="#facc15" />
            </button>
            <button
              type="button"
              className="top-icon-btn has-alert"
              aria-label="알림"
              aria-expanded={openPanel === 'notifications'}
              onClick={(e) => { e.stopPropagation(); togglePanel('notifications'); }}
            >
              <Bell size={18} />
            </button>
            <button
              type="button"
              className="top-pill-btn"
              aria-label="언어 선택"
              aria-expanded={openPanel === 'language'}
              onClick={(e) => { e.stopPropagation(); togglePanel('language'); }}
            >
              <Languages size={17} />
              <span>{LANGUAGES[language]?.short ?? 'KO'}</span>
              <ChevronDown size={13} />
            </button>
            <button
              type="button"
              className="top-pill-btn"
              onClick={(e) => { e.stopPropagation(); toggleFontScale(); togglePanel('font'); }}
              aria-pressed={fontScale === 'lg'}
              aria-expanded={openPanel === 'font'}
              aria-label={
                fontScale === 'lg' ? '글자 크기 원래대로 줄이기' : '글자 크기 크게 보기'
              }
            >
              <Type size={17} />
              <span>A</span>
              <ChevronDown size={13} />
            </button>
            <button
              type="button"
              className="top-app-btn"
              aria-label="위젯"
              aria-expanded={openPanel === 'widgets'}
              onClick={(e) => { e.stopPropagation(); togglePanel('widgets'); }}
            >
              <Grid3X3 size={18} />
            </button>

            {openPanel && (
              <div className="top-dropdown" onClick={(e) => e.stopPropagation()}>
                {openPanel === 'favorites' && (
                  <>
                    <h3>{text.favorite}</h3>
                    <button type="button" onClick={() => goTo('/places')}>찜한 맛집 보기</button>
                    <button type="button" onClick={() => goTo('/events')}>찜 관광지 보기</button>
                    <button type="button" onClick={() => openModal('favorites')}>즐겨찾기 관리</button>
                    <p>자주 보는 콘텐츠를 빠르게 열 수 있어요.</p>
                  </>
                )}
                {openPanel === 'notifications' && (
                  <>
                    <h3>{text.notifications}</h3>
                    <button type="button" className="dropdown-item strong" onClick={() => openModal('notification', { title: '신규 맛집 리뷰 12건 수집' })}>신규 맛집 리뷰 12건 수집</button>
                    <button type="button" className="dropdown-item" onClick={() => openModal('notification', { title: '이번 주 관광 행사 업데이트' })}>이번 주 관광 행사 업데이트</button>
                    <button type="button" className="dropdown-item" onClick={() => openModal('notification', { title: '채용 공고 4건 추가' })}>채용 공고 4건 추가</button>
                  </>
                )}
                {openPanel === 'language' && (
                  <>
                    <h3>{text.language}</h3>
                    {Object.entries(LANGUAGES).map(([key, info]) => (
                      <button
                        key={key}
                        type="button"
                        className={language === key ? 'selected' : ''}
                        onClick={() => selectLanguage(key)}
                      >
                        {language === key && <Check size={14} />} {info.label}
                      </button>
                    ))}
                  </>
                )}
                {openPanel === 'font' && (
                  <>
                    <h3>{text.font}</h3>
                    <button type="button" className={fontScale !== 'lg' ? 'selected' : ''} onClick={() => setFontScale('normal')}>
                      {fontScale !== 'lg' && <Check size={14} />} 기본
                    </button>
                    <button type="button" className={fontScale === 'lg' ? 'selected' : ''} onClick={() => setFontScale('lg')}>
                      {fontScale === 'lg' && <Check size={14} />} 크게
                    </button>
                  </>
                )}
                {openPanel === 'widgets' && (
                  <>
                    <h3>{text.widgets}</h3>
                    <div className="widget-grid">
                      <button type="button" onClick={() => openModal('widget', { title: '날씨' })}>날씨</button>
                      <button type="button" onClick={() => openModal('widget', { title: '인기 키워드' })}>인기 키워드</button>
                      <button type="button" onClick={() => openModal('widget', { title: '내 주변' })}>내 주변</button>
                      <button type="button" onClick={() => openModal('widget', { title: '최근 알림' })}>최근 알림</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>
        <main className="main-content">
          <h1 className="mobile-page-title">{pageTitle}</h1>
          <Outlet />
        </main>
      </div>
      {modal && (
        <ActionModal
          modal={modal}
          language={language}
          onClose={() => setModal(null)}
          onNavigate={goTo}
        />
      )}
    </div>
  );
}

function ActionModal({ modal, language, onClose, onNavigate }) {
  const languageLabel = LANGUAGES[language]?.label ?? LANGUAGES.ko.label;
  const title = getModalTitle(modal, languageLabel);
  return (
    <div className="action-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="action-modal-close" onClick={onClose} aria-label="닫기">
          <X size={18} />
        </button>
        <p className="action-modal-eyebrow">Cheonan Dashboard</p>
        <h2 id="action-modal-title">{title}</h2>
        <ModalBody modal={modal} languageLabel={languageLabel} onNavigate={onNavigate} />
      </section>
    </div>
  );
}

function ModalBody({ modal, languageLabel, onNavigate }) {
  if (modal.type === 'favorites') {
    return (
      <>
        <p>즐겨찾기 기능은 현재 로컬 상태 기반으로 준비되어 있어요. 아래 바로가기로 주요 화면을 열 수 있습니다.</p>
        <div className="action-modal-actions">
          <button type="button" onClick={() => onNavigate('/places')}>맛집 · 카페 바로가기</button>
          <button type="button" onClick={() => onNavigate('/events')}>관광 바로가기</button>
        </div>
      </>
    );
  }
  if (modal.type === 'language') {
    return <p>언어가 {languageLabel}(으)로 변경되었습니다. 공통 네비게이션/상단바부터 즉시 반영됩니다.</p>;
  }
  if (modal.type === 'notification') {
    return <p>{modal.title} 알림 상세입니다. 관련 데이터는 최신 API 응답 기준으로 대시보드에 반영되어 있습니다.</p>;
  }
  if (modal.type === 'widget') {
    return (
      <>
        <p>{modal.title} 위젯을 열었습니다. 대시보드 카드와 연결되는 빠른 보기 영역입니다.</p>
        <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}>
          대시보드에서 보기 <ExternalLink size={14} />
        </a>
      </>
    );
  }
  return <p>요청한 작업을 열었습니다.</p>;
}

function getModalTitle(modal, languageLabel) {
  if (modal.type === 'favorites') return '즐겨찾기 관리';
  if (modal.type === 'language') return `${languageLabel} 적용 완료`;
  if (modal.type === 'notification') return modal.title || '알림 상세';
  if (modal.type === 'widget') return `${modal.title} 위젯`;
  return '상세 보기';
}
