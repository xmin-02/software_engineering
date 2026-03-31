import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './CollegePage.css';

const TABS = [
  { key: 'contests', label: '공모전' },
  { key: 'scholarships', label: '장학금' },
  { key: 'housing', label: '주거' },
];

export default function CollegePage() {
  const [activeTab, setActiveTab] = useState('contests');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 맛집 추천 상태
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/college/${activeTab}`);
      setData(Array.isArray(res.data) ? res.data : res.data.items ?? []);
    } catch {
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 대학생 추천 맛집 로드
  useEffect(() => {
    const fetchPlaces = async () => {
      setPlacesLoading(true);
      setPlacesError(null);
      try {
        const res = await api.get('/api/places', { params: { age_group: 'college', size: 6 } });
        setPlaces(Array.isArray(res.data) ? res.data : res.data.items ?? []);
      } catch {
        setPlacesError('맛집 데이터를 불러올 수 없습니다');
      } finally {
        setPlacesLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr.slice(0, 10);
  };

  const formatPrice = (price) => {
    if (price == null) return '-';
    return Number(price).toLocaleString() + '원';
  };

  return (
    <div className="college-page">
      <h1 className="college-page-title">대학생</h1>

      <div className="tab-bar">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            className={`tab-btn${activeTab === key ? ' active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="status-msg">데이터를 불러오는 중...</p>}
      {error && <p className="status-msg error">{error}</p>}

      {!loading && !error && data.length === 0 && (
        <p className="status-msg">아직 데이터가 없습니다</p>
      )}

      {/* 공모전 */}
      {!loading && !error && activeTab === 'contests' && data.length > 0 && (
        <div className="card-grid">
          {data.map((item, i) => (
            <div key={item.id ?? i} className="college-card">
              <span className="card-badge contest">{item.category ?? '공모전'}</span>
              <h3 className="card-title">{item.title}</h3>
              <p className="card-meta">주최: {item.organizer ?? '-'}</p>
              <p className="card-meta deadline">마감: {formatDate(item.deadline)}</p>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="card-link">자세히 →</a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 장학금 */}
      {!loading && !error && activeTab === 'scholarships' && data.length > 0 && (
        <div className="card-grid">
          {data.map((item, i) => (
            <div key={item.id ?? i} className="college-card">
              <span className="card-badge scholarship">장학금</span>
              <h3 className="card-title">{item.title}</h3>
              <p className="card-meta">기관: {item.organization ?? '-'}</p>
              <p className="card-meta">금액: {item.amount ?? '-'}</p>
              <p className="card-meta">자격: {item.eligibility ?? '-'}</p>
              <p className="card-meta deadline">마감: {formatDate(item.deadline)}</p>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="card-link">자세히 →</a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 주거 */}
      {!loading && !error && activeTab === 'housing' && data.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>주소</th>
                <th>거래유형</th>
                <th>가격</th>
                <th>면적(㎡)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={item.id ?? i}>
                  <td>{item.address ?? '-'}</td>
                  <td><span className={`trade-badge ${item.deal_type}`}>{item.deal_type ?? '-'}</span></td>
                  <td>{formatPrice(item.price)}</td>
                  <td>{item.area_sqm ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 대학생 추천 맛집 섹션 */}
      <div className="places-section">
        <h2 className="places-title">대학생 추천 맛집</h2>
        <p className="places-desc">카공, 가성비, 데이트 — 대학생 취향 맞춤 천안 맛집</p>
        {placesLoading && <p className="status-msg">맛집 정보를 불러오는 중...</p>}
        {placesError && <p className="status-msg error">{placesError}</p>}
        {!placesLoading && !placesError && places.length === 0 && (
          <p className="status-msg">등록된 맛집이 없습니다</p>
        )}
        {!placesLoading && !placesError && places.length > 0 && (
          <div className="places-grid">
            {places.map((place, i) => (
              <div key={place.id ?? i} className="place-card">
                <h3 className="place-name">{place.name}</h3>
                {place.tags && place.tags.length > 0 && (
                  <div className="college-place-tags">
                    {place.tags.map((tag, ti) => (
                      <span key={ti} className="college-place-tag">{tag}</span>
                    ))}
                  </div>
                )}
                {place.category && (
                  <span className="place-category">{place.category}</span>
                )}
                {place.address && (
                  <p className="place-address">{place.address}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
