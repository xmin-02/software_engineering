import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import './PlacesPage.css';
import placeImage1 from '../assets/figma/place-1.jpg';
import placeImage2 from '../assets/figma/place-2.jpg';
import placeImage3 from '../assets/figma/place-3.jpg';
import placeImage4 from '../assets/figma/place-4.jpg';
import placeImage5 from '../assets/figma/place-6.jpg';

const PLACE_IMAGES = [placeImage1, placeImage2, placeImage3, placeImage4, placeImage5, placeImage1];
const FAVORITES_KEY = 'cheonan_favorite_places';

const FIGMA_PLACES = [
  { id: 'figma-1', category: '카페', sub_category: '카페/디저트', address: '신부동', name: '모던 아카이브', description: '직접 로스팅한 원두와 미니멀한 인테리어가 돋보이는 감성 카페', distance: '1.2km', is_open_now: true, rating: 4.8, review_count: 1248, image_url: placeImage1 },
  { id: 'figma-2', category: '양식', address: '불당동', name: '테이블 오브 더 시티', description: '지역 특산물을 활용한 창의적인 파인 다이닝을 경험해보세요', distance: '3.5km', status: '브레이크 타임', rating: 4.9, review_count: 2108, image_url: placeImage2 },
  { id: 'figma-3', category: '한식', address: '쌍용동', name: '정성 담은 한 그릇', description: '어머니의 손맛을 그대로 담은 천안식 전통 비빔밥 전문점', distance: '800m', is_open_now: true, rating: 4.6, review_count: 981, image_url: placeImage3 },
  { id: 'figma-4', category: '카페', sub_category: '베이커리', address: '백석동', name: '밀가루 공방', description: '매일 아침 갓 구운 천연 발효종 빵과 고소한 버터 향이 가득합니다', distance: '2.1km', status: '마감 임박', rating: 4.7, review_count: 843, image_url: placeImage4 },
  { id: 'figma-5', category: '일식', address: '두정동', name: '스시 하루', description: '신선한 제철 생선만을 고집하는 정통 일식 초밥 전문점입니다', distance: '4.2km', is_open_now: true, rating: 4.5, review_count: 702, image_url: placeImage5 },
  { id: 'figma-6', category: '양식', address: '청당동', name: '화덕의 미학', description: '참나무 장작으로 구워낸 쫄깃한 도우의 정통 나폴리 피자', distance: '5.5km', is_open_now: true, rating: 4.7, review_count: 612, image_url: placeImage1 },
];

const CATEGORY_TABS = ['전체', '한식', '일식/중식', '카페/디저트'];
const SORTS = ['평점 높은 순', '가까운 거리 순', '리뷰 많은 순'];

function favoriteId(place) {
  return String(place.id ?? place.name);
}

function compactFavorite(place) {
  return {
    id: favoriteId(place),
    name: place.name,
    distance: place.distance ?? '',
    rating: getDisplayRating(place),
    category: place.sub_category || place.category || '맛집',
    address: place.address || '천안시',
    status: getStatus(place),
    image_url: place.image_url || place.photo_url || '',
  };
}

function normalizeImageUrl(url, fallback) {
  if (!url) return fallback;
  if (url.startsWith('https://')) return url;
  if (url.startsWith('http://')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;
  }
  return fallback;
}

function getDisplayRating(place) {
  const rating = place.rating ?? place.rating_naver ?? place.rating_kakao;
  if (rating) return Number(rating).toFixed(1).replace('.0', '.0');
  if (place.avg_sentiment_score != null) return Math.max(4.1, Math.min(4.9, 4 + Number(place.avg_sentiment_score))).toFixed(1);
  return '4.8';
}

function getArea(address = '') {
  const match = address.match(/(불당동|신부동|쌍용동|백석동|두정동|청당동|성정동|봉명동|대흥동|신방동|안서동)/);
  return match?.[1] ?? address.split(' ').slice(-1)[0] ?? '천안';
}

function getBadge(place) {
  const category = place.sub_category || place.category || 'RESTAURANT';
  if (category.includes('카페') || category.includes('디저트')) return 'CAFE';
  if (category.includes('한식')) return 'KOREAN';
  if (category.includes('일식')) return 'JAPANESE';
  if (category.includes('중식')) return 'CHINESE';
  if (category.includes('분식')) return 'KOREAN';
  if (category.includes('베이커리') || category.includes('빵')) return 'BAKERY';
  if (category.includes('양식') || category.includes('이탈')) return 'ITALIAN';
  return 'RESTAURANT';
}

function getStatus(place) {
  if (place.status) return place.status;
  if (place.is_open_now === true) return '영업 중';
  if (place.is_open_now === false) return '영업 종료';
  return '영업 중';
}

function matchesCategory(place, category) {
  if (category === '전체') return true;
  const text = `${place.category ?? ''} ${place.sub_category ?? ''}`;
  if (category === '일식/중식') return text.includes('일식') || text.includes('중식');
  if (category === '카페/디저트') return text.includes('카페') || text.includes('디저트') || text.includes('베이커리') || text.includes('빵');
  return text.includes(category);
}

function sourceLabel(source) {
  if (source === 'naver_blog') return '네이버 블로그';
  if (source === 'kakao') return '카카오맵';
  if (source === 'google') return '구글 맵스';
  return source ?? '리뷰';
}

function sentimentLabel(sentiment) {
  if (sentiment === 'positive') return '긍정';
  if (sentiment === 'negative') return '부정';
  return '중립';
}

function formatDate(date) {
  return date ? date.slice(0, 10).replaceAll('-', '.') : '';
}

function ActualPlaceModal({ place, onClose, favorite, onToggleFavorite }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(Boolean(place?.id && !String(place.id).startsWith('figma')));

  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    if (!place?.id || String(place.id).startsWith('figma')) {
      return undefined;
    }
    let ignore = false;
    api.get(`/api/places/${place.id}`, { params: { review_limit: 6 } })
      .then((res) => { if (!ignore) setDetail(res.data); })
      .catch(() => { if (!ignore) setDetail({ place, reviews: [] }); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [place]);

  const current = detail?.place ?? place;
  const reviews = detail?.reviews ?? [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel figma-place-detail" role="dialog" aria-modal="true" aria-label="음식점 정보 패널" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close-btn" type="button" onClick={onClose} aria-label="닫기">✕</button>
        <div className="modal-body">
          <div className="modal-left">
            <span className="category-badge cat-카페">{current.sub_category || current.category || '카페/디저트'}</span>
            <h2 className="modal-place-name">{current.name}</h2>
            <p className="modal-address">{current.address ?? '천안시'}</p>
            <div className="modal-info-row">
              <span className="modal-info-chip">영업시간 {typeof current.business_hours === 'string' ? current.business_hours : current.business_hours?.mon ?? '10:00 - 22:00'}</span>
              <span className="modal-info-chip">전화번호 {current.phone || '041-123-4567'}</span>
            </div>
            <h3 className="modal-reviews-title">최근 리뷰 데이터 <span>총 {current.review_count?.toLocaleString?.() ?? reviews.length}건</span></h3>
            {loading && <p className="modal-status">실제 리뷰를 불러오는 중...</p>}
            {!loading && reviews.length === 0 && <p className="modal-status">연결된 실제 리뷰가 아직 없습니다.</p>}
            <div className="modal-reviews">
              {reviews.map((review) => (
                <article key={review.id ?? review.review_url} className={`modal-review-item review-border-${review.sentiment === 'positive' ? 'positive' : review.sentiment === 'negative' ? 'negative' : 'neutral'}`}>
                  <div className="modal-review-header"><span className="sentiment-badge badge-neutral">{sentimentLabel(review.sentiment)}</span><span>{sourceLabel(review.source)}</span><time>{formatDate(review.published_at)}</time></div>
                  <p className="modal-review-text">{review.review_text}</p>
                  {review.review_url && <a className="modal-review-more" href={review.review_url} target="_blank" rel="noreferrer">더보기</a>}
                </article>
              ))}
            </div>
          </div>
          <div className="modal-right">
            <div className="modal-right-sticky"><div className="modal-map-placeholder">Kakao Map Loading...</div></div>
            <button type="button" className="dropdown-primary" onClick={() => onToggleFavorite(current)}>{favorite ? '관심 장소 해제' : '관심 장소 저장'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlacesPage() {
  const [places, setPlaces] = useState(FIGMA_PLACES);
  const [selected, setSelected] = useState(null);
  const [category, setCategory] = useState('전체');
  const [sort, setSort] = useState('평점 높은 순');
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch { return []; }
  });

  useEffect(() => {
    let ignore = false;
    api.get('/api/places', { params: { page: 1, size: 200 } })
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
        const seenImages = new Set();
        const withImages = items.filter((item) => {
          const url = item.image_url || item.photo_url;
          if (!url) return false;
          const key = url.replace(/^https?:\/\//, '').replace(/^images\.weserv\.nl\/\?url=/, '');
          if (seenImages.has(key)) return false;
          seenImages.add(key);
          return true;
        });
        if (!ignore && withImages.length) setPlaces(withImages);
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const displayedPlaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = places.filter((place) => {
      const text = `${place.name ?? ''} ${place.category ?? ''} ${place.sub_category ?? ''} ${place.address ?? ''}`.toLowerCase();
      return matchesCategory(place, category) && (!normalizedQuery || text.includes(normalizedQuery));
    });
    const sorted = [...filtered].sort((a, b) => {
      if (sort === '리뷰 많은 순') return (b.review_count ?? 0) - (a.review_count ?? 0);
      if (sort === '가까운 거리 순') return String(a.address ?? '').localeCompare(String(b.address ?? ''), 'ko');
      return Number(getDisplayRating(b)) - Number(getDisplayRating(a));
    });
    if (category !== '전체' || normalizedQuery) return sorted.slice(0, 12);
    const buckets = new Map();
    sorted.forEach((place) => {
      const key = getBadge(place);
      buckets.set(key, [...(buckets.get(key) ?? []), place]);
    });
    const mixed = [];
    while (mixed.length < 12 && [...buckets.values()].some((bucket) => bucket.length)) {
      [...buckets.keys()].forEach((key) => {
        const next = buckets.get(key)?.shift();
        if (next && mixed.length < 12) mixed.push(next);
      });
    }
    return mixed;
  }, [category, places, query, sort]);

  const toggleFavorite = (place) => {
    setFavorites((current) => {
      const id = favoriteId(place);
      const exists = current.some((item) => item.id === id || item === id);
      const next = exists ? current.filter((item) => (item.id ?? item) !== id) : [...current, compactFavorite(place)];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('cheonan:favorites-updated'));
      return next;
    });
  };

  return (
    <div className="places-page places-figma-page">
      <div className="page-header">
        <h1 className="places-page-title">맛집 & 카페</h1>
        <span className="page-subtitle">천안시 시민들이 추천하는 로컬 큐레이션</span>
      </div>

      <div className="figma-place-controls">
        <nav className="figma-category-tabs" aria-label="맛집 카테고리">
          {CATEGORY_TABS.map((label) => <button key={label} type="button" className={category === label ? 'active' : ''} onClick={() => setCategory(label)}>{label}</button>)}
        </nav>
        <div className="figma-sort-row">
          {SORTS.map((label) => <button key={label} type="button" className={sort === label ? 'active' : ''} onClick={() => setSort(label)}>{label}</button>)}
          <label className="figma-place-search"><span className="sr-only">매장 검색</span><input value={query} placeholder="매장명 또는 메뉴 검색..." onChange={(event) => setQuery(event.target.value)} /></label>
        </div>
      </div>

      <div className="card-grid figma-places-grid">
        {displayedPlaces.map((place, index) => {
          const id = String(place.id ?? place.name);
          const favorite = favorites.some((item) => (item.id ?? item) === id);
          return (
            <article key={id} className="place-card figma-place-card" role="button" tabIndex={0} onClick={() => setSelected(place)} onKeyDown={(event) => { if (event.key === 'Enter') setSelected(place); }}>
              <div className="place-card-image-wrap">
                <img src={normalizeImageUrl(place.image_url || place.photo_url, PLACE_IMAGES[index % PLACE_IMAGES.length])} alt="" className="place-card-image" loading="lazy" onError={(event) => { event.currentTarget.src = PLACE_IMAGES[index % PLACE_IMAGES.length]; }} />
                <span className="place-rating-pill">★ {getDisplayRating(place)}</span>
                <button type="button" className={`place-favorite-btn${favorite ? ' active' : ''}`} aria-label={`${place.name} 즐겨찾기`} onClick={(event) => { event.stopPropagation(); toggleFavorite(place); }}>{favorite ? '★' : '☆'}</button>
              </div>
              <div className="figma-place-meta"><span>{getBadge(place)}</span><strong>{getArea(place.address)}</strong></div>
              <h3 className="place-name">{place.name}</h3>
              <p className="place-address">{place.description || place.address || '천안 시민들이 추천하는 로컬 플레이스'}</p>
              <div className="figma-place-bottom"><span>{place.distance ?? `${index + 1}.${index}km`}</span><strong>{getStatus(place)}</strong></div>
            </article>
          );
        })}
      </div>
      {displayedPlaces.length === 0 && <p className="status-msg">검색 결과가 없습니다</p>}
      <button type="button" className="figma-more-btn" onClick={() => setQuery('')}>더 많은 맛집 보기</button>
      {selected && <ActualPlaceModal key={selected.id ?? selected.name} place={selected} favorite={favorites.some((item) => (item.id ?? item) === favoriteId(selected))} onToggleFavorite={toggleFavorite} onClose={() => setSelected(null)} />}
    </div>
  );
}
