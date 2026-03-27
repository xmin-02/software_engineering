import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './EventsPage.css';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [category, setCategory] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (category) params.category = category;
      if (upcomingOnly) params.upcoming = true;
      const res = await api.get('/api/events', { params });
      setEvents(Array.isArray(res.data) ? res.data : res.data.items ?? []);
    } catch {
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [category, upcomingOnly]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr.slice(0, 10);
  };

  return (
    <div className="events-page">
      <h1 className="page-title">행사/축제</h1>

      <div className="filter-bar">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="filter-select"
        >
          <option value="">전체 카테고리</option>
          <option value="festival">축제</option>
          <option value="exhibition">전시</option>
          <option value="concert">공연</option>
          <option value="sports">스포츠</option>
          <option value="education">교육</option>
        </select>

        <label className="toggle-label">
          <input
            type="checkbox"
            checked={upcomingOnly}
            onChange={(e) => setUpcomingOnly(e.target.checked)}
          />
          예정된 행사만 보기
        </label>
      </div>

      {loading && <p className="status-msg">데이터를 불러오는 중...</p>}
      {error && <p className="status-msg error">{error}</p>}

      {!loading && !error && (
        <div className="event-grid">
          {events.length === 0
            ? <p className="status-msg">아직 데이터가 없습니다</p>
            : events.map((ev, i) => (
              <div key={ev.id ?? i} className="event-card">
                <div className="event-header">
                  <span className="event-category">{ev.category ?? '기타'}</span>
                </div>
                <h3 className="event-title">{ev.title}</h3>
                <div className="event-meta">
                  <span className="meta-item">
                    📅 {ev.start_date || ev.end_date
                      ? `${formatDate(ev.start_date)}${ev.end_date ? ` ~ ${formatDate(ev.end_date)}` : ''}`
                      : '상시 운영'}
                  </span>
                  {ev.location && (
                    <span className="meta-item">📍 {ev.location}</span>
                  )}
                </div>
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
