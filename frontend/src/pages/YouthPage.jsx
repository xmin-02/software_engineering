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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr.slice(0, 10);
  };

  return (
    <div className="youth-page">
      <h1 className="page-title">대학 공지</h1>

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
                      <td className="date-cell">{formatDate(n.date ?? n.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}
    </div>
  );
}
