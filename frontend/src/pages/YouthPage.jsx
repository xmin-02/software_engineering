import './YouthPage.css';

const POLICIES = [
  {
    title: '청년 주택 임차보증금',
    description: '천안시에 거주하는 무주택 청년을 대상으로 주택 임차보증금 대출 이자를 지원하여 주거 부담을 완화합니다.',
  },
  {
    title: '청년 마음건강 지원',
    description: '심리적 어려움을 겪는 청년들에게 전문 상담 서비스와 바우처를 제공하여 건강한 일상을 되찾아줍니다.',
  },
  {
    title: '청년 문화카드',
    description: '연간 10만원 상당의 문화예술 향유 기회를 제공하여 청년들의 문화 생활을 장려하고 삶의 질을 높입니다.',
  },
];

const RESOURCES = [
  { title: 'AI 자기소개서 클리닉', description: '빅데이터 분석을 통한 맞춤형 첨삭 지도', action: '서비스 이용하기' },
  { title: '언택트 모의 면접', description: '화면 너머 면접관과의 실전 연습 피드백', action: '예약 신청하기' },
  { title: '청년 창업 커뮤니티', description: '지역 스타트업 네트워크 및 멘토링', action: '커뮤니티 가입' },
];

const SPACES = [
  { title: '청년센터 이음', description: '성정동 위치 | 스터디룸 & 미팅룸', status: 'AVAILABLE' },
  { title: '청년 창업 거점센터', description: '불당동 위치 | 공유 오피스 & 메이커스페이스', status: 'AVAILABLE' },
  { title: '북카페 휴(休)', description: '신안동 위치 | 독서 및 휴식 전용', status: 'LIMITED' },
];

export default function YouthPage() {
  return (
    <div className="youth-page youth-portal-page">
      <section className="youth-hero">
        <div className="youth-hero-stat">
          <span>지원 완료 청년 수</span>
          <strong>12,482명</strong>
        </div>
        <p className="youth-eyebrow">CHEONAN YOUTH PORTAL</p>
        <h1>당신의 성장을 돕는<br />천안 청년 지원 공간</h1>
        <p className="youth-hero-desc">천안시의 모든 청년들이 꿈을 펼칠 수 있도록 정책부터 일자리, 공간까지 한곳에서 지원합니다.</p>
      </section>

      <section className="youth-section">
        <div className="youth-section-head">
          <p>Policy Support</p>
          <h2>천안 청년을 위한 맞춤형 정책 지원 시스템</h2>
          <button type="button">전체 보기</button>
        </div>
        <div className="youth-policy-grid">
          {POLICIES.map((policy) => (
            <article key={policy.title} className="youth-policy-card">
              <h3>{policy.title}</h3>
              <p>{policy.description}</p>
              <a href="https://www.cheonan.go.kr/" target="_blank" rel="noreferrer">Learn More</a>
            </article>
          ))}
        </div>
      </section>

      <section className="youth-opportunity">
        <div>
          <p>Employment Resources</p>
          <span>HOT OPPORTUNITY</span>
          <h2>2024 상반기<br />천안 청년 인턴쉽</h2>
          <p>시청, 산하기관, 관내 우수기업에서 실무 경험을 쌓고 취업 역량을 강화할 인재를 모집합니다.</p>
          <div className="youth-action-row">
            <button type="button">Apply Now</button>
            <button type="button" className="ghost">View PDF Guide</button>
          </div>
        </div>
        <div className="youth-resource-list">
          {RESOURCES.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <button type="button">{item.action}</button>
            </article>
          ))}
        </div>
      </section>

      <section className="youth-section">
        <div className="youth-section-head">
          <p>Youth Spaces</p>
          <h2>자유롭게 이용 가능한 천안시 청년 전용 복합 공간</h2>
        </div>
        <div className="youth-space-grid">
          {SPACES.map((space) => (
            <article key={space.title} className="youth-space-card">
              <h3>{space.title}</h3>
              <p>{space.description}</p>
              <span className={space.status === 'LIMITED' ? 'limited' : ''}>{space.status}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
