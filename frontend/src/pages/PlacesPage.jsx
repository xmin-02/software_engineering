import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/client';
import './PlacesPage.css';

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
      setPlaces(Array.isArray(data) ? data : data.items ?? []);
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
      setRanking(Array.isArray(res.data) ? res.data : res.data.items ?? []);
    } catch {
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'list') fetchPlaces();
    else fetchRanking();
  }, [activeTab, fetchPlaces, fetchRanking]);

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
    setPage(1);
  };

  const renderStars = (score) => {
    if (score == null) return '-';
    return `★ ${Number(score).toFixed(1)}`;
  };

  const PlaceCard = ({ place, rank }) => (
    <div className="place-card">
      {rank != null && <span className="rank-badge">{rank}</span>}
      <div className="place-info">
        <h3 className="place-name">{place.name}</h3>
        <span className="place-category">{place.category ?? '-'}</span>
        <p className="place-address">{place.address ?? '-'}</p>
        <div className="place-scores">
          <span className="score naver">네이버 {renderStars(place.naver_rating)}</span>
          <span className="score kakao">카카오 {renderStars(place.kakao_rating)}</span>
          <span className="score sentiment">감성 {place.sentiment_score != null ? Number(place.sentiment_score).toFixed(2) : '-'}</span>
          <span className="score reviews">리뷰 {place.review_count ?? 0}건</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="places-page">
      <h1 className="page-title">맛집/카페</h1>

      <div className="tab-bar">
        <button
          className={`tab-btn${activeTab === 'list' ? ' active' : ''}`}
          onClick={() => { setActiveTab('list'); setPage(1); }}
        >
          전체 목록
        </button>
        <button
          className={`tab-btn${activeTab === 'ranking' ? ' active' : ''}`}
          onClick={() => setActiveTab('ranking')}
        >
          감성 랭킹
        </button>
        <button
          className={`tab-btn${activeTab === 'map' ? ' active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          지도
        </button>
      </div>

      {activeTab === 'list' && (
        <div className="filter-bar">
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
            {openNow ? '🟢 영업 중만' : '전체 보기'}
          </button>
        </div>
      )}

      {loading && <p className="status-msg">데이터를 불러오는 중...</p>}
      {error && <p className="status-msg error">{error}</p>}

      {!loading && !error && activeTab === 'list' && (
        <>
          <div className="card-grid">
            {places.length === 0
              ? <p className="status-msg">아직 데이터가 없습니다</p>
              : places.map((p, i) => <PlaceCard key={p.id ?? i} place={p} />)
            }
          </div>
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>이전</button>
            <span>{page}페이지</span>
            <button disabled={!hasNext} onClick={() => setPage((prev) => prev + 1)}>다음</button>
          </div>
        </>
      )}

      {!loading && !error && activeTab === 'ranking' && (
        <div className="card-grid">
          {ranking.length === 0
            ? <p className="status-msg">아직 데이터가 없습니다</p>
            : ranking.map((p, i) => <PlaceCard key={p.id ?? i} place={p} rank={i + 1} />)
          }
        </div>
      )}

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
          <div style="padding:8px 12px;font-size:13px;max-width:200px;line-height:1.4">
            <strong>${place.name}</strong><br/>
            <span style="color:#888">${place.category ?? ''}</span><br/>
            <span style="color:#666">${place.address ?? ''}</span>
            ${place.review_count ? `<br/><span style="color:#1565c0">리뷰 ${place.review_count}건</span>` : ''}
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

  return (
    <div className="map-container">
      <div ref={mapRef} style={{ width: '100%', height: '500px', borderRadius: '12px' }} />
      <p className="map-info">{places.filter(p => p.latitude).length}개 장소 표시</p>
    </div>
  );
}
