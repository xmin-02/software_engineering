import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';
import './PlacesPage.css';

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

// 감성 점수(0~1) → 등급/이모지
function getSentimentClass(score) {
  if (score == null) return 'neutral';
  if (score >= 0.6) return 'positive';
  if (score <= 0.4) return 'negative';
  return 'neutral';
}

function getSentimentEmoji(score) {
  if (score == null) return '—';
  if (score >= 0.6) return '😊';
  if (score <= 0.4) return '😞';
  return '😐';
}

// 장소 카드 컴포넌트
function PlaceCard({ place, rank }) {
  const catClass = CATEGORY_CLASS[place.category] ?? 'cat-default';
  const sentimentClass = getSentimentClass(place.avg_sentiment_score);
  const sentimentPct = place.avg_sentiment_score != null
    ? Math.round(place.avg_sentiment_score * 100)
    : null;

  const rankClass = rank != null
    ? `place-card ranked rank-${rank}`
    : 'place-card';

  return (
    <div className={rankClass}>
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

      {/* 리뷰 수 + 감성 점수 바 */}
      <div className="place-meta">
        <span className="review-count">
          💬 {place.review_count ?? 0}건
        </span>

        {sentimentPct != null ? (
          <div className="sentiment-wrap">
            <div className="sentiment-label">
              <span>감성</span>
              <span>{getSentimentEmoji(place.avg_sentiment_score)} {sentimentPct}%</span>
            </div>
            <div className="sentiment-bar-track">
              <div
                className={`sentiment-bar-fill ${sentimentClass}`}
                style={{ width: `${sentimentPct}%` }}
              />
            </div>
          </div>
        ) : (
          <span className="no-sentiment">감성 데이터 없음</span>
        )}
      </div>
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
      setHasNext(data.has_next ?? false);
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

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  return (
    <div className="places-page">
      {/* 헤더 */}
      <div className="page-header">
        <h1 className="page-title">맛집 · 카페</h1>
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
              : places.map((p, i) => <PlaceCard key={p.id ?? i} place={p} />)
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
            : ranking.map((p, i) => <PlaceCard key={p.id ?? i} place={p} rank={i + 1} />)
          }
        </div>
      )}

      {/* 지도 */}
      {activeTab === 'map' && <KakaoMap places={places} />}
    </div>
  );
}

function KakaoMap({ places }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !window.kakao) return;

    const initMap = () => {
      const kakao = window.kakao;
      const center = new kakao.maps.LatLng(36.8151, 127.1139);
      const map = new kakao.maps.Map(mapRef.current, {
        center,
        level: 7,
      });
      mapInstanceRef.current = map;

      const bounds = new kakao.maps.LatLngBounds();
      let hasMarker = false;

      places.forEach((place) => {
        if (!place.latitude || !place.longitude) return;
        const pos = new kakao.maps.LatLng(place.latitude, place.longitude);
        bounds.extend(pos);
        hasMarker = true;

        const marker = new kakao.maps.Marker({ map, position: pos });

        const content = `
          <div style="padding:10px 14px;font-size:13px;max-width:220px;line-height:1.5;border-radius:8px">
            <strong style="color:#111827">${place.name}</strong><br/>
            <span style="color:#6366f1;font-size:11px;font-weight:600">${place.category ?? ''}</span><br/>
            <span style="color:#6b7280;font-size:12px">${place.address ?? ''}</span>
            ${place.review_count ? `<br/><span style="color:#4f46e5;font-size:12px">💬 리뷰 ${place.review_count}건</span>` : ''}
          </div>
        `;
        const infowindow = new kakao.maps.InfoWindow({ content });

        kakao.maps.event.addListener(marker, 'click', () => {
          infowindow.open(map, marker);
        });
      });

      if (hasMarker) {
        map.setBounds(bounds);
      }
    };

    if (window.kakao.maps) {
      kakao.maps.load(initMap);
    }
  }, [places]);

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
      />
    </div>
  );
}
