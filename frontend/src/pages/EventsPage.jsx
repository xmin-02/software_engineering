import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Heart, MapPin, ArrowRight, ChevronDown } from 'lucide-react';
import './EventsPage.css';
import api from '../api/client';
import { kakaoMapUrl, kakaoSearchUrl } from '../utils/kakaoMap';
import tourismEvent1 from '../assets/figma/tourism/tourism-event-1.jpg';
import tourismEvent2 from '../assets/figma/tourism/tourism-event-2.jpg';
import tourismEvent3 from '../assets/figma/tourism/tourism-event-3.jpg';
import tourismSpot1 from '../assets/figma/tourism/tourism-spot-1.jpg';
import tourismSpot2 from '../assets/figma/tourism/tourism-spot-2.jpg';
import tourismSpot3 from '../assets/figma/tourism/tourism-spot-3.jpg';
import tourismMap from '../assets/figma/tourism/tourism-map.jpg';

const EVENT_FALLBACKS = [
  {
    title: '천안 흥타령 춤축제',
    category: '축제',
    date: '일정 확인 중',
    dday: 'D-5',
    image: tourismEvent1,
    tone: 'orange',
  },
  {
    title: '시립미술관 기획전',
    category: '전시',
    date: '일정 확인 중',
    dday: 'D-12',
    image: tourismEvent2,
    tone: 'indigo',
  },
  {
    title: '가을 밤의 클래식 산책',
    category: '공연',
    date: '일정 확인 중',
    dday: 'D-18',
    image: tourismEvent3,
    tone: 'rose',
  },
];

const TOURISM_FAVORITES_KEY = 'cheonan_favorite_tourism';

const SPOT_FALLBACKS = [
  {
    title: '독립기념관',
    category: '역사 명소',
    rating: null,
    address: '동남구 목천읍 삼방로 95',
    image: tourismSpot1,
    url: 'https://i815.or.kr/',
  },
  {
    title: '각원사',
    category: '자연/힐링',
    rating: null,
    address: '동남구 각원사길 245',
    image: tourismSpot2,
    url: 'https://www.cheonan.go.kr/',
  },
  {
    title: '아라리오 갤러리',
    category: '예술/문화',
    rating: null,
    address: '동남구 만남로 43',
    image: tourismSpot3,
    url: 'https://www.arario.com/',
  },
];


export default function EventsPage() {
  const [eventOffset, setEventOffset] = useState(0);
  const [events, setEvents] = useState([]);
  const [sortMode, setSortMode] = useState('가까운 순');
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TOURISM_FAVORITES_KEY) || '[]'); } catch { return []; }
  });
  useEffect(() => {
    let ignore = false;
    api.get('/api/events')
      .then((res) => {
        if (ignore) return;
        const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
        setEvents(items.slice(0, 9));
      })
      .catch(() => { if (!ignore) setEvents([]); });
    return () => { ignore = true; };
  }, []);
  const eventSource = events.length
    ? events.map((event, index) => ({
      title: event.title,
      category: event.category || '명소',
      date: event.start_date || event.end_date || event.location || '일정 확인 필요',
      dday: event.start_date ? '예정' : '상시',
      image: event.image_url || EVENT_FALLBACKS[index % EVENT_FALLBACKS.length].image,
      tone: EVENT_FALLBACKS[index % EVENT_FALLBACKS.length].tone,
      url: event.url,
    }))
    : EVENT_FALLBACKS;
  const upcomingEvents = useMemo(() => eventSource.map((_, index, array) => array[(index + eventOffset) % array.length]).slice(0, 3), [eventOffset, eventSource]);
  const chosenSpots = useMemo(() => {
    const eventSpots = events
      .filter((event) => event.image_url || event.location)
      .slice(0, 3)
      .map((event, index) => ({
        title: event.title,
        category: event.category || '천안 명소',
        rating: null,
        address: event.location || '천안시',
        image: event.image_url || SPOT_FALLBACKS[index % SPOT_FALLBACKS.length].image,
        url: event.url,
      }));
    const spots = eventSpots.length >= 3 ? eventSpots : SPOT_FALLBACKS;
    if (sortMode === '평점 순') return [...spots].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    return spots;
  }, [events, sortMode]);
  const toggleFavorite = (spot) => {
    setFavorites((current) => {
      const exists = current.some((item) => item.title === spot.title);
      const next = exists ? current.filter((item) => item.title !== spot.title) : [...current, spot];
      localStorage.setItem(TOURISM_FAVORITES_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('cheonan:favorites-updated'));
      return next;
    });
  };

  return (
    <div className="tourism-page">
      <header className="tourism-hero">
        <h1>천안을 발견하다</h1>
        <p>
          역사와 현대가 공존하는 천안의 아름다운 명소와 활기찬 축제를 경험해보세요.
          엄선된 큐레이션을 통해 당신만의 특별한 여정을 시작하세요.
        </p>
      </header>

      <section className="tourism-section tourism-events" aria-label="예정된 행사">
        <div className="tourism-section-head">
          <h2>UPCOMING EVENTS</h2>
          <div className="tourism-arrow-row" aria-hidden="true">
            <button type="button" onClick={() => setEventOffset((value) => (value + eventSource.length - 1) % eventSource.length)} aria-label="이전 행사"><ChevronLeft size={14} /></button>
            <button type="button" onClick={() => setEventOffset((value) => (value + 1) % eventSource.length)} aria-label="다음 행사"><ChevronRight size={14} /></button>
          </div>
        </div>
        <div className="tourism-event-row">
          {upcomingEvents.map((event) => (
            <TourismEventCard key={`${event.category}-${event.title}`} event={event} />
          ))}
        </div>
      </section>

      <section className="tourism-section tourism-chosen" aria-label="추천 관광지">
        <div className="tourism-section-head">
          <h2>CHOSEN FOR YOU</h2>
          <button type="button" className="tourism-sort-btn" onClick={() => setSortMode((value) => (value === '가까운 순' ? '평점 순' : '가까운 순'))}>{sortMode} <ChevronDown size={15} /></button>
        </div>
        <div className="tourism-spot-grid">
          {chosenSpots.map((spot) => (
            <TourismSpotCard key={spot.title} spot={spot} favorite={favorites.some((item) => item.title === spot.title)} onToggleFavorite={toggleFavorite} onSelect={setSelectedSpot} />
          ))}
        </div>
      </section>

      <section className="tourism-map-section" aria-label="지도에서 명소 찾기">
        <div className="tourism-map-copy">
          <h2>천안 관광 지도</h2>
          <p>
            주요 관광지와 행사 위치를 한눈에 보는 안내 영역입니다. 정확한 길찾기와 현재 운영 정보는 카카오맵에서 확인하세요.
          </p>
          <div className="tourism-map-legend">
            <span><i className="good" />쾌적함</span>
            <span><i className="normal" />보통</span>
            <span><i className="busy" />혼잡</span>
          </div>
        </div>
        <a className="tourism-map-art" href={kakaoSearchUrl({ title: '천안 관광지' })} target="_blank" rel="noreferrer" aria-label="카카오맵에서 천안 관광지 검색">
          <img src={tourismMap} alt="천안 관광지 위치 안내" />
        </a>
      </section>
      {selectedSpot && <TourismSpotModal spot={selectedSpot} favorite={favorites.some((item) => item.title === selectedSpot.title)} onToggleFavorite={toggleFavorite} onClose={() => setSelectedSpot(null)} />}
    </div>
  );
}

function TourismEventCard({ event }) {
  const content = (
    <article className={`tourism-event-card tone-${event.tone}`}>
      <div className="tourism-event-image">
        <img src={event.image} alt="" loading="lazy" />
        <span>{event.category}</span>
      </div>
      <div className="tourism-event-body">
        <strong>{event.dday}</strong>
        <h3>{event.title}</h3>
        <p><CalendarDays size={12} />{event.date}</p>
      </div>
    </article>
  );
  return event.url ? <a className="tourism-card-link" href={event.url} target="_blank" rel="noreferrer">{content}</a> : content;
}

function TourismSpotCard({ spot, favorite, onToggleFavorite, onSelect }) {
  const content = (
    <article className="tourism-spot-card" onClick={() => onSelect(spot)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') onSelect(spot); }}>
      <div className="tourism-spot-image">
        <img src={spot.image} alt="" loading="lazy" />
        <button type="button" className={favorite ? 'active' : ''} aria-label={`${spot.title} 찜하기`} onClick={(event) => { event.stopPropagation(); onToggleFavorite(spot); }}><Heart size={20} fill={favorite ? 'currentColor' : 'none'} /></button>
      </div>
      <div className="tourism-spot-body">
        <div className="tourism-spot-meta">
          <span>{spot.category}</span>
          <em>{spot.rating ? `★ ${spot.rating}` : '추천'}</em>
        </div>
        <h3>{spot.title}</h3>
        <p><MapPin size={13} />{spot.address}</p>
        <a href={spot.url || kakaoMapUrl(spot)} onClick={(e) => e.stopPropagation()} target="_blank" rel="noreferrer" className="tourism-discover-btn">
          Discover <ArrowRight size={14} />
        </a>
      </div>
    </article>
  );
  return content;
}


function TourismSpotModal({ spot, favorite, onToggleFavorite, onClose }) {
  return (
    <div className="tourism-modal-overlay" onClick={onClose}>
      <section className="tourism-modal" role="dialog" aria-modal="true" aria-label={`${spot.title} 상세`} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="tourism-modal-close" onClick={onClose}>닫기</button>
        <img src={spot.image} alt="" />
        <span>{spot.category}</span>
        <h2>{spot.title}</h2>
        <p><MapPin size={14} />{spot.address}</p>
        <strong>{spot.rating ? `★ ${spot.rating}` : '추천 명소'}</strong>
        <div className="tourism-modal-actions">
          <button type="button" onClick={() => onToggleFavorite(spot)}>{favorite ? '찜 해제' : '찜하기'}</button>
          <a href={spot.url || kakaoMapUrl(spot)} target="_blank" rel="noreferrer">관련 페이지 이동</a>
        </div>
      </section>
    </div>
  );
}
