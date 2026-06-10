import './JobsPage.css';

const FIGMA_JOBS = [
  { company: '천안 테크놀로지', location: '천안시 서북구', title: '시니어 프론트엔드 개발자 채용 (React/Tailwind)', experience: '시니어', job_type: 'IT/개발', deadline: '2024.06.30', source: 'HOT OPPORTUNITY' },
  { company: '그린 푸드 코리아', location: '천안시 동남구', title: '품질관리 신입 사원 모집', experience: '신입', job_type: '제조/생산', deadline: '상시채용', source: '채용' },
  { company: '미래 자산 관리', location: '천안시 서북구', title: '재무 상담 및 영업 주니어 전문가', experience: '주니어', job_type: '영업', deadline: '2024.05.15', source: '채용' },
  { company: '디자인 한울', location: '천안시 서북구', title: 'UI/UX 브랜드 디자이너 (3년 이상)', experience: '미드', job_type: '디자인', deadline: '2024.05.20', source: '채용' },
];

export default function JobsPage() {
  return (
    <div className="jobs-page">
      <h1 className="jobs-page-title">채용</h1>
      <p className="jobs-subtitle">천안시의 최신 채용 정보와 일자리를 한눈에 확인하세요.</p>
      <div className="filter-bar">
        <button type="button" className="filter-select">전체 경력</button>
        <button type="button" className="filter-select">전체 직종</button>
        <button type="button" className="jobs-filter-btn">필터 적용</button>
      </div>

      <div className="job-list">
        {FIGMA_JOBS.map((job) => (
          <article key={job.title} className="job-card">
            <div className="job-main">
              <div className="job-info">
                <p className="job-company">{job.company}</p>
                <span className="job-location-text">{job.location}</span>
                <h3 className="job-title">{job.title}</h3>
                <div className="job-tags"><span className="tag experience">{job.experience}</span><span className="tag type">{job.job_type}</span><span className="tag deadline">마감일: {job.deadline}</span></div>
              </div>
              <div className="job-right"><span className="job-source">{job.source}</span></div>
            </div>
          </article>
        ))}
      </div>

      <div className="pagination figma-pagination"><button type="button">이전</button><span>1</span><span>/ 5</span><button type="button">다음</button></div>
    </div>
  );
}
