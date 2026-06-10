import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3, UtensilsCrossed, MapPin, GraduationCap,
  BookOpen, Briefcase, Users, Search, Star, Bell, Languages,
  Type, Grid3X3, Accessibility, School, Pill, Globe2, Home,
  Check, ChevronDown, X, ExternalLink, MapPin as PinIcon, CalendarDays, CloudSun,
} from 'lucide-react';
import './Layout.css';
import sidebarLogo from '../assets/brand/cheonan-insight-sidebar.png';

const FONT_SCALE_KEY = 'cheonan_font_scale';
const LANGUAGE_KEY = 'cheonan_language';
const PLACE_FAVORITES_KEY = 'cheonan_favorite_places';
const TOURISM_FAVORITES_KEY = 'cheonan_favorite_tourism';

const LANGUAGES = {
  en: { label: 'English', short: 'EN' },
  ko: { label: '한국어', short: 'KO' },
  ja: { label: '日本語', short: 'JA' },
  zh: { label: '中文', short: 'ZH' },
  es: { label: 'Español', short: 'ES' },
};

const NOTIFICATION_ITEMS = [
  { tag: '천안', text: '천안시청 신규 주차 금지 구역이 지정되었습니다', time: '5분 전' },
  { tag: '교통', text: '천안 교통정보 천안IC 인근 교통 지체가 발생했습니다', time: '1시간 전' },
  { tag: '날씨', text: '기상청 천안시 미세먼지 주의보가 발령되었습니다', time: '3시간 전' },
  { tag: '행사', text: '천안시 문화재단 천안흥타령춤축제 일정이 공지되었습니다', time: '5시간 전' },
];

const makeWidgetItems = (date = new Date()) => {
  const koreanDate = new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' }).format(date);
  return [
    { label: koreanDate, value: '오늘 날씨', desc: '대시보드에서 최신 생활 정보를 확인하세요', Icon: CloudSun },
    { label: '미세먼지', value: '환경 정보', desc: '실시간 대기 정보는 공식 API 연동 기준으로 표시됩니다', Icon: Pill },
    { label: '오늘 일정', value: '행사 보기', desc: '관광/행사 탭에서 최신 행사 데이터를 확인하세요', Icon: CalendarDays },
  ];
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
  const [favoritePlaces, setFavoritePlaces] = useState([]);
  const [favoriteTourism, setFavoriteTourism] = useState([]);
  const widgetItems = useMemo(() => makeWidgetItems(), []);

  useEffect(() => {
    const loadFavorites = () => {
      try { setFavoritePlaces(JSON.parse(localStorage.getItem(PLACE_FAVORITES_KEY) || '[]')); } catch { setFavoritePlaces([]); }
      try { setFavoriteTourism(JSON.parse(localStorage.getItem(TOURISM_FAVORITES_KEY) || '[]')); } catch { setFavoriteTourism([]); }
    };
    loadFavorites();
    window.addEventListener('storage', loadFavorites);
    window.addEventListener('cheonan:favorites-updated', loadFavorites);
    return () => {
      window.removeEventListener('storage', loadFavorites);
      window.removeEventListener('cheonan:favorites-updated', loadFavorites);
    };
  }, []);

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
    setFontScale((v) => (v === 'lg' || v === 'xl' ? 'normal' : 'lg'));

  const pageTitle = pageTitles[location.pathname] ?? '천안 대시보드';
  const text = UI_TEXT[language] ?? UI_TEXT.ko;
  const togglePanel = (panel) => {
    if (panel === 'favorites') {
      try { setFavoritePlaces(JSON.parse(localStorage.getItem(PLACE_FAVORITES_KEY) || '[]')); } catch { setFavoritePlaces([]); }
      try { setFavoriteTourism(JSON.parse(localStorage.getItem(TOURISM_FAVORITES_KEY) || '[]')); } catch { setFavoriteTourism([]); }
    }
    setOpenPanel((current) => (current === panel ? null : panel));
  };
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
            <img className="sidebar-brand-logo" src={sidebarLogo} alt="천안 인사이트 - 시민의 생각이 모여, 더 나은 천안으로" draggable="false" />
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
                  <FavoritesDropdown openModal={openModal} favoritePlaces={favoritePlaces} favoriteTourism={favoriteTourism} />
                )}
                {openPanel === 'notifications' && (
                  <NotificationsDropdown openModal={openModal} />
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
                    <div className="font-preview">가나다라마바사 12345</div>
                    {[
                      ['sm', '작게'],
                      ['normal', '기본'],
                      ['lg', '크게'],
                      ['xl', '매우 크게'],
                    ].map(([key, label]) => (
                      <button key={key} type="button" className={fontScale === key ? 'selected' : ''} onClick={() => setFontScale(key)}>
                        {fontScale === key && <Check size={14} />} {label}
                      </button>
                    ))}
                    <button type="button" className="dropdown-primary" onClick={() => openModal('font')}>적용하기</button>
                  </>
                )}
                {openPanel === 'widgets' && (
                  <WidgetsDropdown openModal={openModal} widgetItems={widgetItems} />
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
          favoritePlaces={favoritePlaces}
          favoriteTourism={favoriteTourism}
          onClose={() => setModal(null)}
          onNavigate={(path) => {
            setModal(null);
            goTo(path);
          }}
        />
      )}
    </div>
  );
}


function NotificationsDropdown({ openModal }) {
  return (
    <>
      <div className="dropdown-head-row">
        <h3>알림</h3>
        <button type="button" className="dropdown-text-btn" onClick={() => openModal('notification', { title: '모두 읽음으로 표시' })}>모두 읽음으로 표시</button>
      </div>
      <div className="notification-list">
        {NOTIFICATION_ITEMS.map((item) => (
          <button key={item.text} type="button" className="notification-row" onClick={() => openModal('notification', { title: item.text })}>
            <span className="notification-tag">{item.tag}</span>
            <span className="notification-copy">{item.text}</span>
            <time>{item.time}</time>
          </button>
        ))}
      </div>
    </>
  );
}

function FavoritesDropdown({ openModal, favoritePlaces, favoriteTourism }) {
  const placeCount = favoritePlaces.length;
  const tourismCount = favoriteTourism.length;
  return (
    <>
      <h3>즐겨찾기</h3>
      <button type="button" className="favorite-mini" onClick={() => openModal('favoriteRestaurants')}>
        <span>찜 맛집</span><strong>{placeCount ? `${placeCount}곳 저장` : '저장된 곳 없음'}</strong><small>{placeCount ? '내가 찜한 맛집만 보기' : '맛집 카드의 ☆ 버튼으로 저장하세요'}</small>
      </button>
      <button type="button" className="favorite-mini" onClick={() => openModal('favorites', { title: '청년', primaryPath: '/youth', primaryLabel: '청년 바로가기' })}>
        <span>청년</span><strong>오늘 방문</strong><small>청년 지원 공간과 정책을 확인하세요</small>
      </button>
      <button type="button" className="favorite-mini" onClick={() => openModal('favoriteTourism')}>
        <span>관광지 찜 리스트</span><strong>{tourismCount ? `${tourismCount}곳 저장` : '저장된 곳 없음'}</strong><small>{tourismCount ? '내가 찜한 관광지만 보기' : '관광 카드의 하트 버튼으로 저장하세요'}</small>
      </button>
    </>
  );
}

function WidgetsDropdown({ openModal, widgetItems }) {
  return (
    <>
      <h3>오늘의 위젯</h3>
      <div className="widget-stack">
        {widgetItems.map(({ label, value, desc }) => (
          <button key={label} type="button" className="widget-row" onClick={() => openModal('widget', { title: value })}>
            <span className="widget-dot" />
            <span><b>{label}</b><strong>{value}</strong><small>{desc}</small></span>
          </button>
        ))}
      </div>
      <button type="button" className="dropdown-primary" onClick={() => openModal('widget', { title: '전체 위젯' })}>전체 보기</button>
    </>
  );
}

function buildFavoriteTabs(title, items) {
  const categoryCounts = items.reduce((acc, item) => {
    const raw = typeof item === 'string' ? '저장한 장소' : (item.category || item.subtitle || '저장한 장소');
    const key = String(raw).split('·')[0].trim() || '저장한 장소';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const prefix = title.includes('관광') ? '전체 관광지' : '전체 맛집';
  return [`${prefix} ${items.length}`, ...Object.entries(categoryCounts).map(([name, count]) => `${name} ${count}`)];
}

function FavoriteModal({ title, items, actionLabel, onNavigate }) {
  return (
    <div className="favorite-modal-content">
      <div className="favorite-modal-tabs">
        {buildFavoriteTabs(title, items).map((tab, index) => (
          <span key={tab} className={index === 0 ? 'active' : ''}>{tab}</span>
        ))}
      </div>
      <div className="favorite-modal-grid">
        {items.length === 0 ? (
          <p className="empty-text">아직 저장된 장소가 없습니다</p>
        ) : items.map((item) => {
          const name = typeof item === 'string' ? item : (item.name || item.title);
          const distance = typeof item === 'string' ? '' : (item.distance || '');
          const rating = typeof item === 'string' ? '' : (item.rating || '');
          const reviews = typeof item === 'string' ? '' : (item.reviews || '');
          const category = typeof item === 'string' ? '저장한 장소' : (item.category || item.address || '저장한 장소');
          const status = typeof item === 'string' ? '' : (item.status || item.address || '');
          return (
            <article key={(typeof item === 'string' ? item : item.id) || name}>
              <div className="favorite-card-top"><h3>{name}</h3><span>{distance}</span></div>
              <p className="favorite-rating">{rating ? `★ ${rating}` : '평점 정보 없음'} <span>{reviews}</span></p>
              <p>{category}</p>
              <strong>{status}</strong>
            </article>
          );
        })}
      </div>
      <button type="button" className="favorite-map-btn" onClick={onNavigate}><PinIcon size={15} /> {actionLabel}</button>
    </div>
  );
}

function ActionModal({ modal, language, favoritePlaces, favoriteTourism, onClose, onNavigate }) {
  const languageLabel = LANGUAGES[language]?.label ?? LANGUAGES.ko.label;
  const title = getModalTitle(modal, languageLabel);
  return (
    <div className="action-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className={`action-modal action-modal--${modal.type}`}
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
        <ModalBody modal={modal} languageLabel={languageLabel} favoritePlaces={favoritePlaces} favoriteTourism={favoriteTourism} onNavigate={onNavigate} />
      </section>
    </div>
  );
}

function ModalBody({ modal, languageLabel, favoritePlaces, favoriteTourism, onNavigate }) {
  if (modal.type === 'favorites') {
    return (
      <>
        <p>
          {modal.message
            || '즐겨찾기 기능은 현재 로컬 상태 기반으로 준비되어 있어요. 아래 바로가기로 주요 화면을 열 수 있습니다.'}
        </p>
        <div className="action-modal-actions">
          {modal.primaryPath ? (
            <button type="button" onClick={() => onNavigate(modal.primaryPath)}>
              {modal.primaryLabel || '바로가기'}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => onNavigate('/places')}>맛집 · 카페 바로가기</button>
              <button type="button" onClick={() => onNavigate('/events')}>관광 바로가기</button>
            </>
          )}
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
  if (modal.type === 'font') {
    return <p>글자 크기 설정이 적용되었습니다. 상단바와 주요 콘텐츠가 선택한 크기에 맞춰 표시됩니다.</p>;
  }
  if (modal.type === 'favoriteRestaurants') {
    return <FavoriteModal title="찜한 맛집" items={favoritePlaces} actionLabel="지도에서 모두 보기" onNavigate={() => onNavigate('/places')} />;
  }
  if (modal.type === 'favoriteTourism') {
    return <FavoriteModal title="찜한 관광지" items={favoriteTourism} actionLabel="지도에서 모두 보기" onNavigate={() => onNavigate('/events')} />;
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
  if (modal.type === 'favorites') return modal.title || '즐겨찾기 관리';
  if (modal.type === 'language') return `${languageLabel} 적용 완료`;
  if (modal.type === 'notification') return modal.title || '알림 상세';
  if (modal.type === 'font') return '글자 크기 설정';
  if (modal.type === 'favoriteRestaurants') return '찜한 맛집';
  if (modal.type === 'favoriteTourism') return '찜한 관광지';
  if (modal.type === 'widget') return `${modal.title} 위젯`;
  return '상세 보기';
}
