import { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import './JobsPage.css';

const EXPERIENCE_OPTIONS = [
  ['전체 경력', ''],
  ['신입', 'entry'],
  ['경력', 'experienced'],
  ['무관', 'any'],
];
const JOB_TYPE_OPTIONS = [
  ['전체 직종', ''],
  ['IT/개발', 'IT/개발'],
  ['제조/생산', '제조/생산'],
  ['영업', 'sales'],
  ['디자인', '디자인'],
];

function labelFrom(options, value) {
  return options.find(([, key]) => key === value)?.[0] ?? options[0][0];
}

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [experience, setExperience] = useState('');
  const [jobType, setJobType] = useState('');
  const [applied, setApplied] = useState(false);
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / 10));
  useEffect(() => {
    let ignore = false;
    api.get('/api/jobs', { params: { page, size: 10, experience_level: applied ? experience || undefined : undefined, job_type: applied ? jobType || undefined : undefined } })
      .then((res) => {
        if (ignore) return;
        setJobs(res.data?.items ?? []);
        setTotal(res.data?.total ?? 0);
      })
      .catch(() => { if (!ignore) { setJobs([]); setTotal(0); } });
    return () => { ignore = true; };
  }, [applied, experience, jobType, page]);
  const visibleJobs = useMemo(() => jobs, [jobs]);

  return (
    <div className="jobs-page">
      <h1 className="jobs-page-title">채용</h1>
      <p className="jobs-subtitle">천안시의 최신 채용 정보와 일자리를 한눈에 확인하세요.</p>
      <div className="filter-bar">
        <button type="button" className="filter-select" onClick={() => { setApplied(false); setExperience((value) => EXPERIENCE_OPTIONS[(EXPERIENCE_OPTIONS.findIndex(([, key]) => key === value) + 1) % EXPERIENCE_OPTIONS.length][1]); }}>{labelFrom(EXPERIENCE_OPTIONS, experience)}</button>
        <button type="button" className="filter-select" onClick={() => { setApplied(false); setJobType((value) => JOB_TYPE_OPTIONS[(JOB_TYPE_OPTIONS.findIndex(([, key]) => key === value) + 1) % JOB_TYPE_OPTIONS.length][1]); }}>{labelFrom(JOB_TYPE_OPTIONS, jobType)}</button>
        <button type="button" className="jobs-filter-btn" onClick={() => { setPage(1); setApplied(true); }}>필터 적용</button>
      </div>

      <div className="job-list">
        {visibleJobs.map((job) => (
          <article key={job.title} className="job-card">
            <div className="job-main">
              <div className="job-info">
                <p className="job-company">{job.company}</p>
                <span className="job-location-text">{job.location}</span>
                <h3 className="job-title">{job.title}</h3>
                <div className="job-tags"><span className="tag experience">{job.experience_level || '경력 무관'}</span><span className="tag type">{job.job_type || '직종 미분류'}</span><span className="tag deadline">마감일: {job.deadline || '상시채용'}</span></div>
              </div>
              <div className="job-right"><span className="job-source">{job.source}</span></div>
            </div>
          </article>
        ))}
      </div>
      {visibleJobs.length === 0 && <p className="status-msg">선택한 조건의 채용 공고가 없습니다</p>}

      <div className="pagination figma-pagination">
        <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))}>이전</button>
        <span>{page}</span><span>/ {totalPages}</span>
        <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>다음</button>
      </div>
    </div>
  );
}
