import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Accessibility, Pill, Globe2, School, Home, BellRing,
  MapPin, Phone, CalendarDays, ExternalLink,
} from 'lucide-react';
import api from '../api/client';
import './InfoPage.css';

const PAGE_CONTENT = {
  '/accessibility': {
    section: 'accessibility',
    title: '무장애 정보',
    eyebrow: 'Barrier-free',
    description: '휠체어 접근, 엘리베이터, 장애인 화장실, 저상버스 주변 시설을 한곳에서 확인합니다.',
    Icon: Accessibility,
    accent: '#2563eb',
  },
  '/high-school': {
    section: 'high-school',
    title: '고등학생',
    eyebrow: 'High school',
    description: '천안 지역 고등학생을 위한 진학, 공모전, 봉사활동, 청소년 공간 정보를 모읍니다.',
    Icon: School,
    accent: '#7c3aed',
  },
  '/medical': {
    section: 'medical',
    title: '의료/약국',
    eyebrow: 'Medical',
    description: '야간/휴일 진료, 약국, 응급실, 소아과 등 생활 의료 정보를 빠르게 찾습니다.',
    Icon: Pill,
    accent: '#059669',
  },
  '/foreign-life': {
    section: 'foreign-life',
    title: '외국인 생활',
    eyebrow: 'Foreign life',
    description: '천안 거주 외국인을 위한 행정, 의료, 언어, 생활 편의 정보를 다국어 기준으로 정리합니다.',
    Icon: Globe2,
    accent: '#0f766e',
  },
  '/single-household': {
    section: 'single-household',
    title: '1인 가구',
    eyebrow: 'Single household',
    description: '혼자 사는 시민을 위한 주거, 안전, 식사, 지원 정책 정보를 맞춤형으로 제공합니다.',
    Icon: Home,
    accent: '#e11d48',
  },
};

const STATUS_FALLBACK = '데이터 확인 중';

export default function InfoPage() {
  const location = useLocation();
  const content = PAGE_CONTENT[location.pathname] ?? PAGE_CONTENT['/accessibility'];
  const Icon = content.Icon;
  const [data, setData] = useState(null);
  const [loadedSection, setLoadedSection] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    api.get(`/api/life-info/${content.section}`)
      .then((res) => {
        if (ignore) return;
        setData(res.data);
        setLoadedSection(content.section);
        setError(null);
      })
      .catch(() => {
        if (!ignore) setError('생활 정보를 불러올 수 없습니다');
      });
    return () => { ignore = true; };
  }, [content.section]);

  const loading = loadedSection !== content.section && !error;
  const currentData = loadedSection === content.section ? data : null;
  const stats = useMemo(() => currentData?.stats ?? [], [currentData]);
  const sections = useMemo(() => currentData?.sections ?? [], [currentData]);
  const sourceLinks = useMemo(() => currentData?.source_links ?? [], [currentData]);

  return (
    <div className="info-page" style={{ '--info-accent': content.accent }}>
      <section className="info-hero">
        <div className="info-hero-icon"><Icon size={30} /></div>
        <div>
          <p className="info-eyebrow">{content.eyebrow}</p>
          <h1 className="info-page-title">{content.title}</h1>
          <p className="info-description">{content.description}</p>
        </div>
        <span className="info-live-pill">
          <BellRing size={14} /> {loading ? STATUS_FALLBACK : currentData?.status ?? '데이터 연동'}
        </span>
      </section>

      {error && <p className="status-msg error" role="alert">{error}</p>}

      {stats.length > 0 && (
        <div className="info-stat-grid" aria-label="연동 데이터 현황">
          {stats.map((stat) => (
            <article key={stat.label} className="info-stat-card">
              <span>{stat.label}</span>
              <strong>{Number(stat.value).toLocaleString()}</strong>
            </article>
          ))}
        </div>
      )}

      {loading && <p className="status-msg" aria-live="polite">데이터를 불러오는 중...</p>}

      {!loading && !error && sections.map((section) => (
        <section key={section.title} className="info-data-section">
          <div className="info-section-head">
            <h2>{section.title}</h2>
            {section.caption && <p>{section.caption}</p>}
          </div>
          <div className="info-card-grid">
            {(section.items ?? []).map((item, index) => (
              <InfoCard key={`${section.title}-${item.id ?? item.title ?? index}`} item={item} />
            ))}
          </div>
        </section>
      ))}

      {sourceLinks.length > 0 && (
        <section className="info-panel" aria-label="공식 확인 링크">
          {sourceLinks.map(({ label, url }) => (
            <a key={url} className="info-panel-row link" href={url} target="_blank" rel="noreferrer">
              <ExternalLink size={18} />
              <span>{label}</span>
              <strong>{url.replace(/^https?:\/\//, '')}</strong>
            </a>
          ))}
        </section>
      )}

      <section className="info-panel">
        <div className="info-panel-row">
          <MapPin size={18} />
          <span>주변 시설</span>
          <strong>천안시 생활권 데이터 기준</strong>
        </div>
        <div className="info-panel-row">
          <Phone size={18} />
          <span>문의</span>
          <strong>기관별 공식 링크 및 전화 확인 권장</strong>
        </div>
        <div className="info-panel-row">
          <CalendarDays size={18} />
          <span>업데이트</span>
          <strong>백엔드 API 연동 완료</strong>
        </div>
      </section>
    </div>
  );
}

function InfoCard({ item }) {
  const body = (
    <article className="info-card data-card">
      <span className="info-card-kicker">{item.subtitle ?? item.meta ?? 'Cheonan'}</span>
      <h2>{item.title}</h2>
      {item.description && <p>{item.description}</p>}
      {item.meta && <strong className="info-card-meta">{item.meta}</strong>}
    </article>
  );

  if (!item.url) return body;
  return (
    <a className="info-card-link" href={item.url} target="_blank" rel="noreferrer">
      {body}
    </a>
  );
}
