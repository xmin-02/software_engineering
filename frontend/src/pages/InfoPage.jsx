import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Accessibility,
  BellRing,
  CalendarDays,
  Globe2,
  Home,
  MapPin,
  Phone,
  Pill,
  School,
} from 'lucide-react';
import api from '../api/client';
import './InfoPage.css';

const FIGMA_PAGES = {
  '/accessibility': {
    section: 'accessibility',
    title: '무장애 정보',
    eyebrow: '실시간 업데이트',
    description:
      '천안시는 모든 시민이 편리하게 이용할 수 있는 무장애 환경을 구축하고 있습니다. 휠체어 접근 가능 시설, 장애인 화장실, 저상버스, 콜택시 정보를 확인하세요.',
    Icon: Accessibility,
    accent: '#2563eb',
    chips: ['전체', '휠체어 접근', '장애인 화장실', '저상버스', '콜택시'],
    countLabel: '총 12개의 시설',
    cards: [
      {
        title: '천안시청',
        subtitle: '공공기관',
        status: '✓ 이용가능',
        address: '천안시 서북구 번영로 156',
        description: '주출입구 경사로, 엘리베이터, 장애인 주차구역 10면 완비',
        phone: '041-521-2000',
      },
      {
        title: '신세계백화점 천안점',
        subtitle: '쇼핑센터',
        status: '✓ 이용가능',
        address: '천안시 서북구 불당21로 93',
        description: '모든 층 경사로 및 엘리베이터 접근 가능, 장애인 주차 20면',
        phone: '041-621-1234',
      },
      {
        title: '천안종합터미널',
        subtitle: '교통시설',
        status: '✓ 이용가능',
        address: '천안시 동남구 터미널9길 36',
        description: '터미널 전체 경사로, 휠체어 리프트, 장애인 전용 대기실',
        phone: '041-551-1814',
      },
      {
        title: '천안역',
        subtitle: '교통시설',
        status: '✓ 이용가능',
        address: '천안시 동남구 만남로 23',
        description: '1층 대합실 장애인 화장실, 전동휠체어 충전 가능',
        phone: '041-570-2114',
      },
    ],
  },
  '/high-school': {
    section: 'high-school',
    title: '고등학생',
    eyebrow: '실시간 업데이트',
    description:
      '천안시 주요 학원가 정보와 스터디카페, 청소년수련관, 입시설명회 일정을 확인하세요. 체계적인 학습 계획으로 목표를 달성하세요!',
    Icon: School,
    accent: '#7c3aed',
    chips: ['신부동 학원가', '두정동 학원가', '불당동 학원가', '스터디카페', '청소년수련관', '입시설명회'],
    special: { label: '2027 수능까지', value: '계산 중' },
    countLabel: '총 4개의 정보',
    mapTitle: '신부동 학원가 지도',
    mapMeta: '총 4개 학원',
    cards: [
      {
        title: '메가스터디 천안신부점',
        distance: '0.3km',
        status: '운영중',
        address: '충남 천안시 동남구 신부동 432-5',
        hours: '평일 14:00-22:00, 주말 09:00-22:00',
        description: '수학, 영어, 국어, 과학',
      },
      {
        title: '대성학원 신부캠퍼스',
        distance: '0.5km',
        status: '운영중',
        address: '충남 천안시 동남구 신부동 512-8',
        hours: '평일 13:00-22:00, 토 09:00-18:00',
        description: '종합반, 수학특강',
      },
      {
        title: '이투스 247 천안신부',
        distance: '0.4km',
        status: '운영중',
        address: '충남 천안시 동남구 신부동 398-12',
        hours: '평일 15:00-23:00, 주말 10:00-20:00',
        description: '영어, 수학, 논술',
      },
      {
        title: '시대인재 천안점',
        distance: '0.6km',
        status: '운영중',
        address: '충남 천안시 동남구 신부동 456-3',
        hours: '평일 14:00-22:00',
        description: '국어, 영어, 수학',
      },
    ],
  },
  '/medical': {
    section: 'medical',
    title: '의료 약국',
    eyebrow: '실시간 업데이트',
    description:
      '천안시는 모든 시민이 편리하게 이용할 수 있는 의료 서비스를 제공하고 있습니다. 가까운 병원, 의원, 약국 정보를 확인하세요.',
    Icon: Pill,
    accent: '#059669',
    chips: ['야간/응급진료', '분만가능 산부인과', '보건소 검진', '정형외과', '내과', '한의원'],
    countLabel: '총 3개의 시설',
    cards: [
      {
        title: '단국대학교병원 응급실',
        distance: '1.2km',
        status: '✓ 운영중',
        address: '충남 천안시 동남구 단대로 119',
        hours: '24시간 운영',
        phone: '041-550-6119',
      },
      {
        title: '천안의료원 응급의료센터',
        distance: '2.5km',
        status: '✓ 운영중',
        address: '충남 천안시 동남구 천안대로 795',
        hours: '24시간 운영',
        phone: '041-570-7119',
      },
      {
        title: '순천향대학교 천안병원',
        distance: '3.1km',
        status: '✓ 운영중',
        address: '충남 천안시 동남구 순천향6길 31',
        hours: '24시간 응급실 운영',
        phone: '041-570-5119',
      },
    ],
  },
  '/foreign-life': {
    section: 'foreign-life',
    title: '외국인 생활',
    eyebrow: '실시간 업데이트',
    description:
      '천안시는 외국인 주민을 위한 다양한 지원 서비스를 제공합니다. 출입국, 의료, 생활, 긴급상담 등 필요한 정보를 확인하세요.',
    Icon: Globe2,
    accent: '#0f766e',
    chips: ['출입국·외국인청', '외국인노동자지원', '다국어 의료', '할랄/베트남 식료품', '모스크', '1345 긴급상담'],
    countLabel: '총 2개의 시설',
    cards: [
      {
        title: '천안출입국·외국인청',
        distance: '2.3km',
        status: '운영중',
        address: '충남 천안시 서북구 불당22대로 114',
        hours: '평일 09:00-18:00',
        phone: '041-564-6700',
        description: '영어, 중국어, 베트남어',
      },
      {
        title: '천안시 외국인주민지원센터',
        distance: '1.5km',
        status: '운영중',
        address: '충남 천안시 동남구 천안대로 400',
        hours: '평일 09:00-18:00',
        phone: '041-521-2961',
        description: '영어, 중국어, 베트남어, 타갈로그어',
      },
    ],
  },
  '/single-household': {
    section: 'single-household',
    title: '1인 가구',
    eyebrow: '실시간 업데이트',
    description: '천안에서 혼자 살아도 든든하게. 주거·식사·생활·취미를 한 곳에서 확인하세요.',
    Icon: Home,
    accent: '#e11d48',
    chips: ['주거', '혼밥', '안전', '생활지원', '취미', '정책'],
    special: { label: '1인가구 추천', value: 'NEW' },
    countLabel: '총 128건',
    cards: [
      {
        title: '원룸/오피스텔 월세',
        subtitle: '주거',
        status: '최신 거래',
        address: '천안 시내 전 지역 최신 주거 후보',
        description: '월세·전세 조건과 접근성을 함께 확인하세요.',
      },
      {
        title: '혼밥/카페 추천',
        subtitle: '식사',
        status: '추천',
        address: '카페·분식·한식 위주',
        description: '혼자 방문하기 좋은 조용한 장소를 우선 표시합니다.',
      },
      {
        title: '안심 귀가/위급 상황',
        subtitle: '안전',
        status: '체크',
        address: '112 / 119 / 천안시 생활 안전 정보',
        description: '위급 상황과 생활 안전 정보를 빠르게 확인합니다.',
      },
    ],
  },
};

const STATUS_FALLBACK = '데이터 확인 중';

function getDday(targetDate) {
  const target = new Date(`${targetDate}T00:00:00+09:00`);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / 86400000);
  return diff >= 0 ? `D-${diff}` : '종료';
}

function normalizeInfoCard(item) {
  return {
    title: item.title,
    subtitle: item.subtitle || item.category,
    distance: item.distance,
    status: item.status || item.meta,
    address: item.address || item.description,
    hours: item.hours,
    phone: item.phone,
    description: item.description && item.address ? item.description : '',
  };
}

export default function InfoPage() {
  const location = useLocation();
  const content = FIGMA_PAGES[location.pathname] ?? FIGMA_PAGES['/accessibility'];
  const resolvedContent = content.section === 'high-school'
    ? { ...content, special: { ...content.special, value: getDday('2026-11-19') } }
    : content;
  const Icon = resolvedContent.Icon;
  const [data, setData] = useState(null);
  const [activeChip, setActiveChip] = useState('전체');
  const [page, setPage] = useState(1);
  const [loadedSection, setLoadedSection] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    api.get(`/api/life-info/${resolvedContent.section}`)
      .then((res) => {
        if (ignore) return;
        setData(res.data);
        setLoadedSection(resolvedContent.section);
        setError(null);
      })
      .catch(() => {
        if (!ignore) setError('생활 정보를 불러올 수 없습니다');
      });
    return () => { ignore = true; };
  }, [resolvedContent.section]);

  useEffect(() => {
    setActiveChip(resolvedContent.chips[0] ?? '전체');
    setPage(1);
  }, [resolvedContent.chips]);

  const loading = loadedSection !== resolvedContent.section && !error;
  const currentData = loadedSection === resolvedContent.section ? data : null;
  const apiCards = currentData?.sections?.flatMap((section) => section.items ?? []).map(normalizeInfoCard) ?? [];
  const displayCards = apiCards.length ? apiCards : resolvedContent.cards;
  const displayCountLabel = apiCards.length ? `총 ${apiCards.length}개의 정보` : resolvedContent.countLabel;
  void useMemo;

  if (resolvedContent.section === 'single-household') {
    return <SingleHouseholdPortal content={resolvedContent} apiData={currentData} />;
  }

  return (
    <div className="info-page figma-info-page" style={{ '--info-accent': resolvedContent.accent }}>
      <section className="info-figma-topline">
        <h1>{resolvedContent.title}</h1>
        <span className="info-live-pill">
          <BellRing size={14} /> {loading ? STATUS_FALLBACK : resolvedContent.eyebrow}
        </span>
      </section>

      <section className="info-search-row" aria-label="검색 및 상태">
        <div className="info-search-box">전체 검색 (시설명, 주소, 전화번호...)</div>
        <span>KO</span>
        <span>A</span>
      </section>

      <section className="info-figma-hero">
        <div className="info-hero-icon"><Icon size={30} /></div>
        <div>
          <h2>{heroTitle(resolvedContent)}</h2>
          <p>{resolvedContent.description}</p>
          {resolvedContent.special && (
            <div className="info-special-pill">
              <span>{resolvedContent.special.label}</span>
              <strong>{resolvedContent.special.value}</strong>
            </div>
          )}
        </div>
      </section>

      {error && <p className="status-msg error" role="alert">{error}</p>}


      <nav className="info-chip-row" aria-label="카테고리">
        {resolvedContent.chips.map((chip) => (
          <button key={chip} type="button" className={activeChip === chip ? 'active' : ''} onClick={() => setActiveChip(chip)}>{chip}</button>
        ))}
      </nav>

      {resolvedContent.mapTitle && (
        <section className="info-map-panel">
          <div>
            <h2>{resolvedContent.mapTitle}</h2>
            <p>{resolvedContent.mapMeta}</p>
          </div>
          <div className="info-map-placeholder">
            <strong>N</strong>
            <span>학원 위치 | 마커에 마우스를 올려 학원명을 확인하세요</span>
          </div>
        </section>
      )}

      <section className="info-facility-section">
        <div className="info-section-head figma">
          <h2>{activeChip === (resolvedContent.chips[0] ?? '전체') ? displayCountLabel : `${activeChip} 정보`}</h2>
        </div>
        <div className="info-facility-list">
          {displayCards.map((item, index) => (
            <FacilityCard key={`${item.title}-${index}`} item={item} />
          ))}
        </div>
      </section>

      {resolvedContent.section === 'accessibility' && (
        <div className="pagination figma-pagination">
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))}>← 이전</button>
          {[1, 2, 3].map((value) => <span key={value} className={page === value ? 'active' : ''}>{value}</span>)}
          <button type="button" onClick={() => setPage((value) => Math.min(3, value + 1))}>다음 →</button>
        </div>
      )}
    </div>
  );
}


function heroTitle(content) {
  if (content.section === 'foreign-life') return '천안시 외국인 생활 지원 안내';
  if (content.section === 'accessibility') return '천안시 무장애 정보 안내';
  if (content.section === 'high-school') return '천안시 고등학생 학습 정보 안내';
  return `천안시 ${content.title} 정보 안내`;
}

function SingleHouseholdPortal({ content, apiData }) {
  const [view, setView] = useState('cards');
  const [activeTab, setActiveTab] = useState('전체');
  const [radius, setRadius] = useState('1km');
  const [displayMode, setDisplayMode] = useState('카드 그리드');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const apiSections = apiData?.sections ?? [];
  const visibleSections = apiSections.length ? apiSections : [
    { title: '최근 1인 주거 후보', items: content.cards.filter((item) => item.subtitle === '주거') },
    { title: '혼밥/카페 추천', items: content.cards.filter((item) => item.subtitle === '식사') },
    { title: '안전/지원 체크리스트', items: content.cards.filter((item) => item.subtitle === '안전') },
  ];
  const cards = visibleSections.map((section) => {
    const items = section.items ?? [];
    return {
      tag: section.title.includes('주거') ? '주거' : section.title.includes('혼밥') || section.title.includes('카페') ? '식사' : section.title.includes('안전') ? '안전' : '정보',
      count: `${items.length}건`,
      title: section.title,
      desc: section.caption || items[0]?.description || '천안시 연동 데이터 기준으로 표시합니다.',
      details: items.slice(0, 4).flatMap((item) => [item.title, item.meta || item.subtitle || item.address || item.description]).filter(Boolean),
    };
  });
  const services = visibleSections.flatMap((section) => (section.items ?? []).map((item) => [
    section.title.includes('주거') ? '주거' : section.title.includes('혼밥') || section.title.includes('카페') ? '식사' : '지원',
    item.title,
    item.subtitle || '천안 시민',
    item.description || item.address || '천안시',
    item.meta || '수시 갱신',
    item.url ? '상세 보기' : '확인',
  ])).slice(0, 10);
  const stats = apiData?.stats ?? [];
  return (
    <div className="info-page single-portal-page" style={{ '--info-accent': content.accent }}>
      <section className="single-hero">
        <div>
          <span>1인가구 추천 <b>NEW</b></span>
          <h1>천안에서 혼자 살아도 든든하게.</h1>
          <p>주거·식사·생활·취미를 한 곳에서.</p>
        </div>
        <button type="button" onClick={() => setSettingsOpen(true)}>맞춤 설정</button>
      </section>
      <nav className="single-tabs">
        {['전체', '주거', '식사', '편의', '취미'].map((tab) => (
          <button key={tab} type="button" className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>
        ))}
        <button type="button" onClick={() => setView(view === 'cards' ? 'table' : 'cards')}>{view === 'cards' ? '표 리스트' : '카드 그리드'}</button>
      </nav>
      {view === 'cards' ? (
        <div className="single-card-grid">
          {cards.map(({ tag, count, title, desc, details }) => (
            <article key={title}>
              <div className="single-card-kicker"><span>{tag}</span><strong>{count}</strong></div>
              <h2>{title}</h2>
              <p>{desc}</p>
              <div>{details.map((detail) => <b key={detail}>{detail}</b>)}</div>
            </article>
          ))}
        </div>
      ) : (
        <div className="single-table-wrap">
          <table>
            <thead><tr>{['유형', '서비스명', '지원 대상', '지역', '신청 기간', '상태'].map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>{services.map((row) => <tr key={row[1]}>{row.map((cell, i) => <td key={cell}><span className={i === 0 ? 'single-type' : ''}>{cell}</span></td>)}</tr>)}</tbody>
          </table>
          <p>총 {services.length.toLocaleString()}개 서비스 표시</p>
        </div>
      )}
      <section className="single-dashboard">
        <div><h2>우리 지역 서비스 이용 현황</h2><p>실시간 인기 서비스 · 오늘의 신규 등록 · 누적 신청 건수</p></div>
        {stats.slice(0, 3).map((item) => <strong key={item.label}>{item.value?.toLocaleString?.() ?? item.value}{item.label}</strong>)}
      </section>
      {settingsOpen && (
        <div className="single-settings-overlay" onClick={() => setSettingsOpen(false)}>
          <section className="single-settings" onClick={(e) => e.stopPropagation()}>
            <h2>맞춤 설정</h2>
            <p>1인가구 포털을 나에게 맞게 조정하세요. 변경사항은 즉시 반영됩니다.</p>
            <h3>활동 지역 & 검색 반경</h3>
            <label>기본 지역<input readOnly value="천안시 서북구 불당동" /></label>
            <div className="range-row"><span>검색 반경</span><strong>{radius}</strong>{['500m', '1km', '2km', '5km'].map((v) => <button type="button" key={v} className={radius === v ? 'active' : ''} onClick={() => setRadius(v)}>{v}</button>)}</div>
            <h3>알림 설정</h3>
            <div className="setting-list"><label><input type="checkbox" defaultChecked /> 신규 매물 알림 <small>관심 지역의 새 원룸·오피스텔이 등록되면 알려드려요</small></label><label><input type="checkbox" defaultChecked /> 오늘의 혼밥 추천 <small>매일 오전 11시 · 점심 추천 푸시</small></label><label><input type="checkbox" defaultChecked /> 소모임 모집 알림 <small>관심 카테고리의 새 소모임이 열릴 때</small></label></div>
            <h3>표시 방식</h3>
            <div className="range-row">
              <button type="button" className={displayMode === '카드 그리드' ? 'active' : ''} onClick={() => { setDisplayMode('카드 그리드'); setView('cards'); }}>카드 그리드</button>
              <strong>현재 보기</strong>
              <button type="button" className={displayMode === '리스트' ? 'active' : ''} onClick={() => { setDisplayMode('리스트'); setView('table'); }}>리스트</button>
              <span>간결하게</span>
            </div>
            <div className="setting-actions"><button type="button" onClick={() => { setActiveTab('전체'); setRadius('1km'); setDisplayMode('카드 그리드'); setView('cards'); }}>기본값으로 재설정</button><button type="button" onClick={() => setSettingsOpen(false)}>취소</button><button type="button" onClick={() => setSettingsOpen(false)}>설정 저장</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

function FacilityCard({ item }) {
  return (
    <article className="info-facility-card">
      <div className="facility-head">
        <div>
          <h2>{item.title}</h2>
          {(item.subtitle || item.distance) && (
            <p>{[item.subtitle, item.distance].filter(Boolean).join(' · ')}</p>
          )}
        </div>
        {item.status && <span>{item.status}</span>}
      </div>
      {item.address && (
        <p className="facility-row"><MapPin size={16} /> {item.address}</p>
      )}
      {item.hours && (
        <p className="facility-row"><CalendarDays size={16} /> {item.hours}</p>
      )}
      {item.phone && (
        <p className="facility-row"><Phone size={16} /> {item.phone}</p>
      )}
      {item.description && <p className="facility-desc">{item.description}</p>}
      <button type="button" className="facility-route-btn" onClick={() => window.open(`https://map.kakao.com/link/search/${encodeURIComponent(item.title)}`, '_blank', 'noopener,noreferrer')}>길찾기</button>
    </article>
  );
}
