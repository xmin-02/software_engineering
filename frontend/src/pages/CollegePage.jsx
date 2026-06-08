import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import './CollegePage.css';
import collegePlaceImage1 from '../assets/figma/college-place-1.jpg';
import collegePlaceImage2 from '../assets/figma/college-place-2.jpg';
import collegePlaceImage3 from '../assets/figma/college-place-3.jpg';

const UNIVERSITIES = ['단국대', '호서대', '백석대', '상명대'];
const CATEGORIES = ['학사', '취업', '장학', '행사', '공모전'];
const COLLEGE_PLACE_IMAGES = [collegePlaceImage1, collegePlaceImage2, collegePlaceImage3];

export default function CollegePage() {
  const [notices, setNotices] = useState([]);
  const [university, setUniversity] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  const visibleNotices = useMemo(() => notices.slice(0, 8), [notices]);
  const formatDate = (dateStr) => (dateStr ? dateStr.slice(0, 10).replaceAll('-', '.') : '-');

  return (
    <div className="college-page college-figma-page">
      <div className="college-page-head">
        <div>
          <p>대학 공지</p>
          <h1>대학교</h1>
        </div>
        <span>실시간 운영 중</span>
      </div>

      <div className="filter-bar college-filter-bar">
        <label className="sr-only" htmlFor="college-univ-filter">대학 필터</label>
        <select id="college-univ-filter" value={university} onChange={(e) => setUniversity(e.target.value)} className="filter-select">
          <option value="">전체 대학</option>
          {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <label className="sr-only" htmlFor="college-category-filter">카테고리 필터</label>
        <select id="college-category-filter" value={category} onChange={(e) => setCategory(e.target.value)} className="filter-select">
          <option value="">전체 카테고리</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="college-sort-pill">최신순</span>
      </div>

      {loading && <p className="status-msg" aria-live="polite">데이터를 불러오는 중...</p>}
      {error && <p className="status-msg error" role="alert">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper college-notice-panel">
          {visibleNotices.length === 0 ? <p className="status-msg">아직 데이터가 없습니다</p> : (
            <table className="notice-table college-notice-table">
              <caption className="sr-only">대학교 공지 목록</caption>
              <thead>
                <tr>
                  <th>대학교</th>
                  <th>공지 제목</th>
                  <th>카테고리</th>
                  <th>등록일</th>
                </tr>
              </thead>
              <tbody>
                {visibleNotices.map((notice, index) => (
                  <tr key={notice.id ?? index}>
                    <td data-label="대학교"><span className="univ-badge">{notice.university ?? '-'}</span></td>
                    <td data-label="공지 제목">
                      {notice.url ? <a href={notice.url} target="_blank" rel="noreferrer" className="notice-link">{notice.title}</a> : notice.title}
                    </td>
                    <td data-label="카테고리">{notice.category ?? '-'}</td>
                    <td data-label="등록일" className="youth-date-cell">{formatDate(notice.published_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <section className="places-section college-recommend-section">
        <div className="college-section-title-row">
          <div>
            <h2 className="places-title">대학교 추천 맛집</h2>
            <p className="places-desc">대학생들이 가장 많이 찾는 로컬 플레이스</p>
          </div>
          <button type="button">전체 보기</button>
        </div>
        {placesLoading && <p className="status-msg">맛집 정보를 불러오는 중...</p>}
        {placesError && <p className="status-msg error">{placesError}</p>}
        {!placesLoading && !placesError && places.length > 0 && (
          <div className="places-grid">
            {places.slice(0, 3).map((place, i) => (
              <article key={place.id ?? i} className="place-card college-place-card">
                <img
                  className="college-place-image"
                  src={place.image_url ?? COLLEGE_PLACE_IMAGES[i % COLLEGE_PLACE_IMAGES.length]}
                  alt=""
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = COLLEGE_PLACE_IMAGES[i % COLLEGE_PLACE_IMAGES.length]; }}
                />
                <div className="college-place-rating">{place.rating ?? place.avg_rating ?? '4.8'}</div>
                <span className="place-category">{place.category ?? '로컬'}</span>
                <h3 className="place-name">{place.name}</h3>
                <p className="place-address">{place.address ?? '천안시'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
