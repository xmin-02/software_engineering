import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import './CollegePage.css';
import collegePlaceImage1 from '../assets/figma/college-place-1.jpg';
import collegePlaceImage2 from '../assets/figma/college-place-2.jpg';
import collegePlaceImage3 from '../assets/figma/college-place-3.jpg';

const PLACE_IMAGES = [collegePlaceImage1, collegePlaceImage2, collegePlaceImage3];

function formatNoticeDate(value) {
  return value ? value.slice(0, 10).replaceAll('-', '.') : '';
}

function normalizePlaceImage(url, fallback) {
  if (!url) return fallback;
  if (url.startsWith('https://')) return url;
  if (url.startsWith('http://')) return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;
  return fallback;
}

export default function CollegePage() {
  const navigate = useNavigate();
  const [notices, setNotices] = useState([]);
  const [collegePlaces, setCollegePlaces] = useState([]);
  const [university, setUniversity] = useState('전체 대학');
  const [category, setCategory] = useState('학사');

  useEffect(() => {
    let ignore = false;
    api.get('/api/youth/university-notices', { params: { university: university === '전체 대학' ? undefined : university, category: category || undefined } })
      .then((res) => { if (!ignore) setNotices(Array.isArray(res.data) ? res.data : []); })
      .catch(() => { if (!ignore) setNotices([]); });
    return () => { ignore = true; };
  }, [category, university]);

  useEffect(() => {
    let ignore = false;
    api.get('/api/places', { params: { age_group: 'college', size: 6, sort_by: 'review_count' } })
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
        if (!ignore) setCollegePlaces(items.slice(0, 3));
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);

  const visibleNotices = useMemo(() => notices, [notices]);

  return (
    <div className="college-page college-figma-page">
      <div className="college-page-head">
        <div><p>대학 공지</p><h1>대학교</h1></div>
        <span>실시간 운영 중</span>
      </div>

      <div className="filter-bar college-filter-bar">
        <button type="button" className="filter-select" onClick={() => setUniversity((value) => (value === '전체 대학' ? '단국대' : value === '단국대' ? '호서대' : value === '호서대' ? '백석대' : value === '백석대' ? '상명대' : '전체 대학'))}>{university}</button>
        <button type="button" className="filter-select" onClick={() => setCategory((value) => (value === '학사' ? '취업' : value === '취업' ? '장학' : value === '장학' ? '행사' : '학사'))}>{category}</button>
        <span className="college-sort-pill">최신순</span>
      </div>

      <div className="table-wrapper college-notice-panel">
        <table className="notice-table college-notice-table">
          <caption className="sr-only">대학교 공지 목록</caption>
          <thead><tr><th>대학교</th><th>공지 제목</th><th>카테고리</th><th>등록일</th></tr></thead>
          <tbody>
            {visibleNotices.map((notice) => (
              <tr key={notice.id ?? notice.title}>
                <td data-label="대학교"><span className="univ-badge">{notice.university}</span></td>
                <td data-label="공지 제목">{notice.url ? <a href={notice.url} target="_blank" rel="noreferrer">{notice.title}</a> : notice.title}</td>
                <td data-label="카테고리">{notice.category}</td>
                <td data-label="등록일" className="youth-date-cell">{formatNoticeDate(notice.published_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleNotices.length === 0 && <p className="status-msg">선택한 조건의 공지가 없습니다</p>}
      </div>
      <button type="button" className="college-more-btn" onClick={() => { setUniversity('전체 대학'); setCategory(''); }}>더 보기</button>

      <section className="places-section college-recommend-section">
        <div className="college-section-title-row">
          <div><h2 className="places-title">대학교 추천 맛집</h2><p className="places-desc">대학생들이 가장 많이 찾는 로컬 플레이스</p></div>
          <button type="button" onClick={() => navigate('/places')}>전체 보기</button>
        </div>
        <div className="places-grid">
          {collegePlaces.map((place, index) => (
            <article key={place.id ?? place.name} className="place-card college-place-card">
              <img className="college-place-image" src={normalizePlaceImage(place.image_url || place.photo_url, PLACE_IMAGES[index % PLACE_IMAGES.length])} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = PLACE_IMAGES[index % PLACE_IMAGES.length]; }} />
              <div className="college-place-rating">{place.rating ?? (place.avg_sentiment_score ? (4 + Number(place.avg_sentiment_score)).toFixed(1) : '신규')}</div>
              <span className="place-category">{place.category}</span>
              <h3 className="place-name">{place.name}</h3>
              <p className="place-address">{place.address}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
