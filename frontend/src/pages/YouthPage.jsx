import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './YouthPage.css';

const UNIVERSITIES = ['단국대', '호서대', '백석대'];

export default function YouthPage() {
  const [notices, setNotices] = useState([]);
  const [university, setUniversity] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 맛집 추천 상태
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState(null);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (university) params.university = university;
      if (category) params.category = category;
      const res = await api.get('/api/youth/university-notices', { params });
      setNotices(Array.isArray(res.data) ? res.data : res.data.items ?? []);
    } catch {
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [university, category]);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  // 청소년 추천 맛집 로드
  useEffect(() => {
    const fetchPlaces = async () => {
      setPlacesLoading(true);
      setPlacesError(null);
      try {
        const res = await api.get('/api/places', { params: { age_group: 'youth', size: 6 } });
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

  return (
    <div className="youth-page">
      <h1 className="youth-page-title">대학 공지</h1>

      <div className="filter-bar">
        <select
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          className="filter-select"
        >
          <option value="">전체 대학</option>
          {UNIVERSITIES.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="filter-select"
        >
          <option value="">전체 카테고리</option>
          <option value="admission">입학</option>
          <option value="contest">공모전</option>
          <option value="scholarship">장학금</option>
          <option value="general">일반</option>
        </select>
      </div>

      {loading && <p className="status-msg">데이터를 불러오는 중...</p>}
      {error && <p className="status-msg error">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper">
          {notices.length === 0
            ? <p className="status-msg">아직 데이터가 없습니다</p>
            : (
              <table className="notice-table">
                <thead>
                  <tr>
                    <th>대학</th>
                    <th>카테고리</th>
                    <th>제목</th>
                    <th>날짜</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map((n, i) => (
                    <tr key={n.id ?? i}>
                      <td><span className="univ-badge">{n.university ?? '-'}</span></td>
                      <td>{n.category ?? '-'}</td>
                      <td>
                        {n.url
                          ? <a href={n.url} target="_blank" rel="noopener noreferrer" className="notice-link">{n.title}</a>
                          : n.title
                        }
                      </td>
                      <td className="youth-date-cell">{formatDate(n.date ?? n.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {/* 청소년 추천 맛집 섹션 */}
      <div className="places-section">
        <h2 className="places-title">청소년 추천 맛집</h2>
        <p className="places-desc">술집 제외, 청소년이 방문하기 좋은 천안 맛집</p>
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
