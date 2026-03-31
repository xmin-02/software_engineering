import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './EventsPage.css';

const MAIN_CATEGORIES = ['축제', '전시관', '천안8경', '천안12경', '자연관광', '유적지', '산', '사찰', '명소', '관광농원', '박물관'];

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { upcoming: true };
      if (category) params.category = category;
      const res = await api.get('/api/events', { params });
      setEvents(Array.isArray(res.data) ? res.data : res.data.items ?? []);
    } catch {
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const festivals = events.filter((e) => e.category === '축제' || e.category === '빵빵데이');
  const spots = events.filter((e) => e.category !== '축제' && e.category !== '빵빵데이');

  const categories = [...new Set(events.map((e) => e.category).filter(Boolean))].sort();

  return (
    <div className="events-page">
      <h1 className="events-page-title">천안 관광/명소</h1>

      <div className="filter-bar">
        <label className="sr-only" htmlFor="events-category-filter">카테고리 선택</label>
        <select
          id="events-category-filter"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="filter-select"
        >
          <option value="">전체 ({events.length}건)</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading && <p className="status-msg" aria-live="polite">데이터를 불러오는 중...</p>}
      {error && <p className="status-msg error" role="alert">{error}</p>}

      {!loading && !error && (
        <>
          {!category && festivals.length > 0 && (
            <section className="events-section" aria-label="연례 축제">
              <h2 className="events-section-title">연례 축제</h2>
              <div className="event-grid">
                {festivals.map((ev, i) => (
                  <div key={ev.id ?? i} className="event-card festival">
                    <div className="event-header">
                      <span className="event-category festival-tag">{ev.category ?? '축제'}</span>
                    </div>
                    <h3 className="event-title">{ev.title}</h3>
                    {ev.location && <p className="event-location">📍 {ev.location}</p>}
                    {ev.url && (
                      <a href={ev.url} target="_blank" rel="noopener noreferrer" className="event-link-btn">
                        자세히 보기 →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="events-section" aria-label="관광지 및 체험">
            {!category && <h2 className="events-section-title">관광지 &amp; 체험</h2>}
            <div className="event-grid">
              {(category ? events : spots).length === 0
                ? <p className="status-msg">등록된 명소가 없습니다</p>
                : (category ? events : spots).map((ev, i) => (
                  <div key={ev.id ?? i} className="event-card">
                    <div className="event-header">
                      <span className="event-category">{ev.category ?? '기타'}</span>
                    </div>
                    <h3 className="event-title">{ev.title}</h3>
                    {ev.location && <p className="event-location">📍 {ev.location}</p>}
                    {ev.description && ev.description !== ev.category && (
                      <p className="event-desc">{ev.description}</p>
                    )}
                    {ev.url && (
                      <a href={ev.url} target="_blank" rel="noopener noreferrer" className="event-link-btn">
                        자세히 보기 →
                      </a>
                    )}
                  </div>
                ))
              }
            </div>
          </section>
        </>
      )}
    </div>
  );
}
