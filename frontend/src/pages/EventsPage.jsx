import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './EventsPage.css';

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

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return dateStr.slice(0, 10);
  };

  // 실제 데이터에서 카테고리 목록 추출
  const categories = [...new Set(events.map((e) => e.category).filter(Boolean))];

  return (
    <div className="events-page">
      <h1 className="page-title">천안 명소 & 행사</h1>

      <div className="filter-bar">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="filter-select"
        >
          <option value="">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="event-count">{events.length}건</span>
      </div>

      {loading && <p className="status-msg">데이터를 불러오는 중...</p>}
      {error && <p className="status-msg error">{error}</p>}

      {!loading && !error && (
        <div className="event-grid">
          {events.length === 0
            ? <p className="status-msg">등록된 명소/행사가 없습니다</p>
            : events.map((ev, i) => (
              <div key={ev.id ?? i} className="event-card">
                <div className="event-header">
                  <span className="event-category">{ev.category ?? '기타'}</span>
                </div>
                <h3 className="event-title">{ev.title}</h3>
                <div className="event-meta">
                  {(ev.start_date || ev.end_date) && (
                    <span className="meta-item">
                      📅 {formatDate(ev.start_date)}{ev.end_date ? ` ~ ${formatDate(ev.end_date)}` : ''}
                    </span>
                  )}
                  {ev.location && (
                    <span className="meta-item">📍 {ev.location}</span>
                  )}
                </div>
                {ev.description && ev.description !== ev.category && (
                  <p className="event-desc">{ev.description}</p>
                )}
                {ev.url && (
                  <a
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-link-btn"
                  >
                    자세히 보기 →
                  </a>
                )}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
