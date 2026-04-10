import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './JobsPage.css';

const EXPERIENCE_LEVELS = [
  { value: '', label: '전체 경력' },
  { value: 'entry', label: '신입' },
  { value: 'junior', label: '주니어' },
  { value: 'mid', label: '미드' },
  { value: 'senior', label: '시니어' },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [experience, setExperience] = useState('');
  const [jobType, setJobType] = useState('');
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, size: 20 };
      if (experience) params.experience_level = experience;
      if (jobType) params.job_type = jobType;
      const res = await api.get('/api/jobs', { params });
      const data = res.data;
      setJobs(Array.isArray(data) ? data : data.items ?? []);
      setHasNext(data.has_next ?? false);
    } catch {
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [page, experience, jobType]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '상시';
    const d = dateStr.slice(5, 10);
    return d.replace('-', '.');
  };

  return (
    <div className="jobs-page">
      <h1 className="jobs-page-title">채용</h1>

      <div className="filter-bar">
        <label className="sr-only" htmlFor="jobs-experience">경력 필터</label>
        <select
          id="jobs-experience"
          value={experience}
          onChange={(e) => { setExperience(e.target.value); setPage(1); }}
          className="filter-select"
        >
          {EXPERIENCE_LEVELS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="jobs-type">직종 필터</label>
        <select
          id="jobs-type"
          value={jobType}
          onChange={(e) => { setJobType(e.target.value); setPage(1); }}
          className="filter-select"
        >
          <option value="">전체 직종</option>
          <option value="it">IT/개발</option>
          <option value="design">디자인</option>
          <option value="marketing">마케팅</option>
          <option value="sales">영업</option>
          <option value="manufacturing">제조/생산</option>
          <option value="service">서비스</option>
        </select>
      </div>

      {loading && <p className="status-msg" aria-live="polite">데이터를 불러오는 중...</p>}
      {error && <p className="status-msg error" role="alert">{error}</p>}

      {!loading && !error && (
        <>
          <div className="job-list">
            {jobs.length === 0
              ? <p className="status-msg">아직 데이터가 없습니다</p>
              : jobs.map((job, i) => (
                <div key={job.id ?? i} className="job-card">
                  <div className="job-main">
                    <div className="job-info">
                      <h3 className="job-title">{job.title}</h3>
                      <p className="job-company">{job.company ?? '-'}</p>
                      <div className="job-tags">
                        {job.location && <span className="tag location">📍 {job.location}</span>}
                        {job.salary && <span className="tag salary">💰 {job.salary}</span>}
                        {job.experience && <span className="tag experience">{job.experience}</span>}
                      </div>
                    </div>
                    <div className="job-right">
                      <span className="job-source">{job.source ?? '-'}</span>
                      <p className="job-deadline">마감: {formatDate(job.deadline)}</p>
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="apply-btn"
                        >
                          지원하기 →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>

          {jobs.length > 0 && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="이전 페이지"
              >
                이전
              </button>
              <span>{page}페이지</span>
              <button
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
                aria-label="다음 페이지"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
