import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';
import './PlacesPage.css';
import placeImage1 from '../assets/figma/place-1.jpg';
import placeImage2 from '../assets/figma/place-2.jpg';
import placeImage3 from '../assets/figma/place-3.jpg';
import placeImage4 from '../assets/figma/place-4.jpg';
import placeImage5 from '../assets/figma/place-6.jpg';


function formatBusinessHours(hours) {
  if (!hours) return '';
  if (typeof hours === 'string') return hours;
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = dayNames[new Date().getDay()];
  return hours[today] || hours.everyday || Object.values(hours).find(Boolean) || '';
}

function getKakaoMaps() {
  return window.kakao?.maps ?? null;
}

const PLACE_IMAGES = [placeImage1, placeImage2, placeImage3, placeImage4, placeImage5];

function getPlacePositionStyle(place, index = 0) {
  if (!place.latitude || !place.longitude) {
    return {
      left: `${18 + (index % 5) * 15}%`,
      top: `${24 + (index % 4) * 14}%`,
    };
  }

  const minLat = 36.76;
  const maxLat = 36.9;
  const minLng = 127.05;
  const maxLng = 127.24;
  const left = ((place.longitude - minLng) / (maxLng - minLng)) * 100;
  const top = (1 - ((place.latitude - minLat) / (maxLat - minLat))) * 100;

  return {
    left: `${Math.min(94, Math.max(6, left))}%`,
    top: `${Math.min(90, Math.max(10, top))}%`,
  };
}

function FallbackMap({ places, place, compact = false }) {
  const items = place ? [place] : places.filter((p) => p.latitude && p.longitude);

  return (
    <div className={`fallback-map${compact ? ' compact' : ''}`}>
      <div className="fallback-map-grid" />
      <div className="fallback-map-label">천안 좌표 지도</div>
      {items.length === 0 ? (
        <div className="fallback-map-empty">표시할 좌표 정보가 없습니다</div>
      ) : (
        items.map((item, index) => (
          <div
            key={item.id ?? item.name ?? index}
            className="fallback-map-marker"
            style={getPlacePositionStyle(item, index)}
            title={item.name}
          >
            <span className="fallback-map-dot" />
            <span className="fallback-map-name">{item.name}</span>
          </div>
        ))
      )}
    </div>
  );
}

// 감성 뱃지 (리뷰용)
function SentimentBadge({ sentiment }) {
  const map = {
    positive: { label: '긍정', cls: 'badge-positive' },
    negative: { label: '부정', cls: 'badge-negative' },
    neutral:  { label: '중립', cls: 'badge-neutral' },
  };
  const info = map[sentiment] ?? map.neutral;
  return <span className={`sentiment-badge ${info.cls}`}>{info.label}</span>;
}

// 리뷰 한 줄 (3줄 제한 + 더보기)
function ReviewItem({ review }) {
  const [expanded, setExpanded] = useState(false);

  const source = review.source === 'naver_blog' ? '네이버 블로그' : review.source;
  const date = review.published_at
    ? new Date(review.published_at).toLocaleDateString('ko-KR')
    : null;

  // 감성에 따라 왼쪽 보더 클래스 결정
  const borderClass = {
    positive: 'review-border-positive',
    negative: 'review-border-negative',
    neutral:  'review-border-neutral',
  }[review.sentiment] ?? 'review-border-neutral';

  return (
    <div className={`modal-review-item ${borderClass}`}>
      {/* 헤더: 감성뱃지 좌측 / 출처+날짜 우측 */}
      <div className="modal-review-header">
        <SentimentBadge sentiment={review.sentiment} />
        <div className="modal-review-meta">
          <span className="modal-review-source">{source}</span>
          {date && <span className="modal-review-date">{date}</span>}
        </div>
      </div>
      <p className={`modal-review-text${expanded ? ' expanded' : ''}`}>
        {review.review_text}
      </p>
      {/* 텍스트가 길면 더보기 링크 표시 */}
      {review.review_text?.length > 100 && (
        <button
          className="modal-review-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? '접기 ↑' : '더보기 ↓'}
        </button>
      )}
    </div>
  );
}

// 모달 내 미니맵
function ModalMiniMap({ place }) {
  const mapRef = useRef(null);
  const hasCoordinates = Boolean(place.latitude && place.longitude);
  const maps = getKakaoMaps();

  useEffect(() => {
    if (!mapRef.current || !hasCoordinates || !maps) return;

    const init = () => {
      const pos = new maps.LatLng(place.latitude, place.longitude);
      mapRef.current.innerHTML = '';
      const map = new maps.Map(mapRef.current, { center: pos, level: 4 });
      const marker = new maps.Marker({ map, position: pos });

      const content = `
        <div style="padding:8px 12px;font-size:12px;font-weight:600;
          color:#111827;border-radius:6px;white-space:nowrap;
          background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.15)">
          ${place.name}
        </div>
      `;
      const iw = new maps.InfoWindow({ content, removable: false });
      iw.open(map, marker);
    };

    maps.load(init);
  }, [hasCoordinates, maps, place]);

  if (!hasCoordinates) {
    return (
      <div className="modal-map-placeholder">
        <span>좌표 정보 없음</span>
      </div>
    );
  }

  if (!maps) {
    return <FallbackMap place={place} compact />;
  }

  return <div className="modal-map-container" ref={mapRef} />;
}

// 장소 상세 모달
function PlaceDetailModal({ cachedDetail, onClose, onDetailLoaded, placeSummary }) {
  const [data, setData] = useState(
    cachedDetail ?? (placeSummary ? { place: placeSummary, reviews: [] } : null)
  );
  const [loading, setLoading] = useState(!cachedDetail);
  const [error, setError] = useState(null);
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const placeId = placeSummary?.id ?? cachedDetail?.place?.id;

  useEffect(() => {
    if (!placeId || cachedDetail) return undefined;
    let ignore = false;
    api.get(`/api/places/${placeId}`, { params: { review_limit: 10 } })
      .then((res) => {
        if (ignore) return;
        setData(res.data);
        onDetailLoaded(placeId, res.data);
      })
      .catch(() => {
        if (!ignore) setError('상세 정보를 불러올 수 없습니다');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => { ignore = true; };
  }, [cachedDetail, onDetailLoaded, placeId]);

  // ESC 키 닫기
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // 포커스 트랩: 모달 내부로 Tab 순환을 가둠 + 첫 포커스 진입
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusables = () =>
      Array.from(panel.querySelectorAll(selector)).filter(
        (el) => !el.hasAttribute('disabled')
      );
    focusables()[0]?.focus();
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    };
    panel.addEventListener('keydown', onKey);
    return () => panel.removeEventListener('keydown', onKey);
  }, [loading]);

  const place = data?.place;
  const reviews = data?.reviews ?? [];

  // 배경 클릭 시 닫기
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label="장소 상세"
        ref={panelRef}
        tabIndex={-1}
      >
        {/* 닫기 버튼 */}
        <button className="modal-close-btn" onClick={onClose} aria-label="닫기">
          ✕
        </button>

        {loading && !place && <p className="modal-status">불러오는 중...</p>}
        {error && !place && <p className="modal-status error">{error}</p>}

        {place && (
          <div className="modal-body">
            {/* 왼쪽 패널 */}
            <div className="modal-left">
              {/* 장소명 + 카테고리 헤더 블록 */}
              <div className="modal-place-header">
                <div className="modal-place-title-row">
                  <h2 className="modal-place-name">{place.name}</h2>
                  {place.category && (
                    <span className={`category-badge modal-category-badge ${CATEGORY_CLASS[place.category] ?? 'cat-default'}`}>
                      {place.category}
                    </span>
                  )}
                </div>
                {/* 태그 뱃지 (있는 경우만) */}
                {place.tags?.length > 0 && (
                  <div className="modal-tags-row">
                    {place.tags.map((tag) => (
                      <span key={tag} className="modal-tag-badge">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* 주소 */}
              <p className="modal-address">
                <span className="modal-address-icon">📍</span>
                <span>{place.address ?? '주소 정보 없음'}</span>
              </p>

              {/* 부가 정보 (있는 경우만) */}
              <div className="modal-info-row">
                {place.business_hours && (
                  <span className="modal-info-chip">🕐 {formatBusinessHours(place.business_hours)}</span>
                )}
                {place.has_parking != null && (
                  <span className="modal-info-chip">
                    🅿️ {place.has_parking ? '주차 가능' : '주차 불가'}
                  </span>
                )}
                {place.price_range && (
                  <span className="modal-info-chip">💰 {place.price_range}</span>
                )}
              </div>

              {/* 감성 점수 양방향 바 */}
              <div className="modal-sentiment-section">
                <div className="modal-sentiment-header">
                  <span className="modal-sentiment-title">감성 점수</span>
                  <span className="modal-review-total">리뷰 {place.review_count ?? 0}건 기준</span>
                </div>
                <SentimentDualBar score={place.avg_sentiment_score} />
              </div>

              {/* 리뷰 목록 */}
              <div className="modal-reviews">
                <h3 className="modal-reviews-title">
                  블로그 리뷰
                  <span className="modal-reviews-count">
                    {loading ? '불러오는 중' : `${reviews.length}건`}
                  </span>
                </h3>
                {loading && <p className="modal-status">리뷰를 불러오는 중...</p>}
                {!loading && error && <p className="modal-status error">{error}</p>}
                {!loading && !error && reviews.length === 0 && (
                  <p className="modal-status">리뷰 데이터가 없습니다</p>
                )}
                {!loading && !error && reviews.map((r) => (
                  <ReviewItem key={r.id} review={r} />
                ))}
              </div>
            </div>

            {/* 오른쪽 패널 — sticky 지도 */}
            <div className="modal-right">
              <div className="modal-right-sticky">
                <ModalMiniMap place={place} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 카테고리별 CSS 클래스
const CATEGORY_CLASS = {
  '한식': 'cat-한식',
  '중식': 'cat-중식',
  '일식': 'cat-일식',
  '양식': 'cat-양식',
  '카페': 'cat-카페',
  '술집': 'cat-술집',
};

// 1~3위 메달
const MEDALS = ['🥇', '🥈', '🥉'];

// 감성 점수(0~1) → 긍정 퍼센트 정수 (null 가능)
function toSentimentPct(score) {
  return score != null ? Math.round(score * 100) : null;
}

// 양방향 감성 바 공통 컴포넌트
function SentimentDualBar({ score }) {
  const pct = toSentimentPct(score);
  if (pct == null) return <span className="no-sentiment">감성 데이터 없음</span>;

  return (
    <div className="sentiment-dual-bar">
      <div className="sentiment-labels">
        <span className="pos-label">긍정 {pct}%</span>
        <span className="neg-label">부정 {100 - pct}%</span>
      </div>
      <div className="dual-bar-track">
        <div className="dual-bar-pos" style={{ width: `${pct}%` }} />
        <div className="dual-bar-neg" style={{ width: `${100 - pct}%` }} />
      </div>
    </div>
  );
}

// 장소 카드 컴포넌트
function PlaceCard({ place, rank, index = 0, onClick, onPrefetch }) {
  const catClass = CATEGORY_CLASS[place.category] ?? 'cat-default';
  const imageSrc = place.image_url ?? place.photo_url ?? PLACE_IMAGES[index % PLACE_IMAGES.length];

  const rankClass = rank != null
    ? `place-card ranked rank-${rank}`
    : 'place-card';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={rankClass}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onFocus={onPrefetch}
      onMouseEnter={onPrefetch}
      role="button"
      tabIndex={0}
      aria-label={`${place.name} 상세 보기`}
      style={{ cursor: 'pointer' }}
    >
      <div className="place-card-image-wrap">
        <img
          src={imageSrc}
          alt=""
          className="place-card-image"
          loading="lazy"
          onError={(e) => { e.currentTarget.src = PLACE_IMAGES[index % PLACE_IMAGES.length]; }}
        />
        <span className="place-rating-pill">★ {place.rating ?? place.avg_rating ?? '4.8'}</span>
      </div>
      {/* 랭킹 뱃지 */}
      {rank != null && rank <= 3 && (
        <div className="rank-badge-wrap">
          <span className="rank-medal">{MEDALS[rank - 1]}</span>
          <span className="rank-number">{rank}위</span>
        </div>
      )}
      {rank != null && rank > 3 && (
        <div className="rank-badge-plain">{rank}</div>
      )}

      {/* 카드 헤더: 이름 + 카테고리 */}
      <div className="place-card-header">
        <h3 className="place-name">{place.name}</h3>
        {place.category && (
          <span className={`category-badge ${catClass}`}>{place.category}</span>
        )}
      </div>

      {/* 주소 */}
      <p className="place-address">
        <span className="addr-icon">📍</span>
        {place.address ?? '주소 정보 없음'}
      </p>

      {/* 리뷰 수 */}
      <span className="review-count">
        💬 {place.review_count ?? 0}건
      </span>

      {/* 양방향 감성 바 */}
      <SentimentDualBar score={place.avg_sentiment_score} />
    </div>
  );
}

export default function PlacesPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [places, setPlaces] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [detailCache, setDetailCache] = useState({});
  const pendingDetailIdsRef = useRef(new Set());

  const handleDetailLoaded = useCallback((placeId, detail) => {
    setDetailCache((cache) => ({ ...cache, [placeId]: detail }));
  }, []);

  const prefetchPlaceDetail = useCallback((place) => {
    if (!place?.id || detailCache[place.id] || pendingDetailIdsRef.current.has(place.id)) {
      return;
    }

    pendingDetailIdsRef.current.add(place.id);
    api.get(`/api/places/${place.id}`, { params: { review_limit: 10 } })
      .then((res) => {
        setDetailCache((cache) => ({ ...cache, [place.id]: res.data }));
      })
      .catch(() => {})
      .finally(() => {
        pendingDetailIdsRef.current.delete(place.id);
      });
  }, [detailCache]);

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, size: 20 };
      if (category) params.category = category;
      if (openNow) params.open_now = true;
      const res = await api.get('/api/places', { params });
      const data = res.data;
      setPlaces(Array.isArray(data) ? data : (data.items ?? []));
      setHasNext(!Array.isArray(data) && ((data.page ?? page) * (data.size ?? params.size) < (data.total ?? 0)));
    } catch {
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [page, category, openNow]);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/places/ranking', { params: { limit: 10 } });
      setRanking(Array.isArray(res.data) ? res.data : (res.data.items ?? []));
    } catch {
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'list') fetchPlaces();
    else if (activeTab === 'ranking') fetchRanking();
  }, [activeTab, fetchPlaces, fetchRanking]);

  useEffect(() => {
    places.slice(0, 3).forEach((place) => prefetchPlaceDetail(place));
  }, [places, prefetchPlaceDetail]);

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  return (
    <div className="places-page">
      {/* 헤더 */}
      <div className="page-header">
        <h1 className="places-page-title">맛집 · 카페</h1>
        <span className="page-subtitle">천안시 음식점 감성 분석</span>
      </div>

      {/* 탭 바 */}
      <div className="tab-bar">
        <button
          className={`tab-btn${activeTab === 'list' ? ' active' : ''}`}
          onClick={() => { setActiveTab('list'); setPage(1); }}
        >
          <span className="tab-icon">🗂️</span>
          전체 목록
        </button>
        <button
          className={`tab-btn${activeTab === 'ranking' ? ' active' : ''}`}
          onClick={() => setActiveTab('ranking')}
        >
          <span className="tab-icon">🏆</span>
          감성 랭킹
        </button>
        <button
          className={`tab-btn${activeTab === 'map' ? ' active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          <span className="tab-icon">🗺️</span>
          지도
        </button>
      </div>

      {/* 전체 목록 필터 바 */}
      {activeTab === 'list' && (
        <div className="filter-bar">
          <span className="filter-label">
            <span className="filter-icon">⚙️</span>
            필터
          </span>
          <select value={category} onChange={handleCategoryChange} className="filter-select">
            <option value="">전체 카테고리</option>
            <option value="한식">한식</option>
            <option value="중식">중식</option>
            <option value="일식">일식</option>
            <option value="양식">양식</option>
            <option value="카페">카페</option>
            <option value="술집">술집</option>
          </select>
          <button
            className={`toggle-btn${openNow ? ' active' : ''}`}
            onClick={() => { setOpenNow(!openNow); setPage(1); }}
          >
            <span className="toggle-dot" />
            {openNow ? '영업 중만 보기' : '전체 보기'}
          </button>
        </div>
      )}

      {/* 로딩 / 에러 */}
      {loading && <p className="status-msg">데이터를 불러오는 중...</p>}
      {error && <p className="status-msg error">{error}</p>}

      {/* 전체 목록 */}
      {!loading && !error && activeTab === 'list' && (
        <>
          <div className="card-grid">
            {places.length === 0
              ? <p className="status-msg">아직 데이터가 없습니다</p>
              : places.map((p, i) => (
                  <PlaceCard
                    key={p.id ?? i}
                    place={p}
                    index={i}
                    onClick={() => setSelectedPlace(p)}
                    onPrefetch={() => prefetchPlaceDetail(p)}
                  />
                ))
            }
          </div>
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>
              ← 이전
            </button>
            <span className="pagination-page">{page} 페이지</span>
            <button disabled={!hasNext} onClick={() => setPage((prev) => prev + 1)}>
              다음 →
            </button>
          </div>
        </>
      )}

      {/* 감성 랭킹 */}
      {!loading && !error && activeTab === 'ranking' && (
        <div className="card-grid">
          {ranking.length === 0
            ? <p className="status-msg">아직 데이터가 없습니다</p>
            : ranking.map((p, i) => (
                <PlaceCard
                  key={p.id ?? i}
                  place={p}
                  rank={i + 1}
                  index={i}
                  onClick={() => setSelectedPlace(p)}
                  onPrefetch={() => prefetchPlaceDetail(p)}
                />
              ))
          }
        </div>
      )}

      {/* 지도 */}
      {activeTab === 'map' && <KakaoMap places={places} />}

      {/* 장소 상세 모달 */}
      {selectedPlace != null && (
        <PlaceDetailModal
          key={selectedPlace.id}
          cachedDetail={detailCache[selectedPlace.id]}
          onClose={() => setSelectedPlace(null)}
          onDetailLoaded={handleDetailLoaded}
          placeSummary={selectedPlace}
        />
      )}
    </div>
  );
}

function KakaoMap({ places }) {
  const mapRef = useRef(null);
  const maps = getKakaoMaps();

  useEffect(() => {
    const mapNode = mapRef.current;
    if (!mapNode || !maps) return;

    const initMap = () => {
      mapNode.innerHTML = '';
      const center = new maps.LatLng(36.8151, 127.1139);
      const map = new maps.Map(mapNode, {
        center,
        level: 7,
      });

      const bounds = new maps.LatLngBounds();
      let hasMarker = false;

      places.forEach((place) => {
        if (!place.latitude || !place.longitude) return;
        const pos = new maps.LatLng(place.latitude, place.longitude);
        bounds.extend(pos);
        hasMarker = true;

        const marker = new maps.Marker({ map, position: pos });

        const content = `
          <div style="padding:10px 14px;font-size:13px;max-width:220px;line-height:1.5;border-radius:8px">
            <strong style="color:#111827">${place.name}</strong><br/>
            <span style="color:#6366f1;font-size:11px;font-weight:600">${place.category ?? ''}</span><br/>
            <span style="color:#6b7280;font-size:12px">${place.address ?? ''}</span>
            ${place.review_count ? `<br/><span style="color:#4f46e5;font-size:12px">💬 리뷰 ${place.review_count}건</span>` : ''}
          </div>
        `;
        const infowindow = new maps.InfoWindow({ content });

        maps.event.addListener(marker, 'click', () => {
          infowindow.open(map, marker);
        });
      });

      if (hasMarker) {
        map.setBounds(bounds);
      }
    };

    maps.load(initMap);
    return () => {
      mapNode.innerHTML = '';
    };
  }, [maps, places]);

  const visibleCount = places.filter((p) => p.latitude).length;

  return (
    <div className="map-wrapper">
      <div className="map-overlay-badge">
        🗺️ {visibleCount}개 장소
      </div>
      <div
        className="map-container"
        ref={mapRef}
        style={{ width: '100%', height: 'calc(100vh - 220px)', minHeight: '480px' }}
      >
        {!maps && <FallbackMap places={places} />}
      </div>
    </div>
  );
}
