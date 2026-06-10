import { useState } from 'react';
import './YouthPage.css';

const POLICIES = [
  {
    title: '청년 주택 임차보증금',
    description: '천안시에 거주하는 무주택 청년을 대상으로 주택 임차보증금 대출 이자를 지원하여 주거 부담을 완화합니다.',
    target: '천안시 거주 무주택 청년',
    period: '상시 접수 · 예산 소진 시 종료',
    action: '신청 조건 확인',
  },
  {
    title: '청년 마음건강 지원',
    description: '심리적 어려움을 겪는 청년들에게 전문 상담 서비스와 바우처를 제공하여 건강한 일상을 되찾아줍니다.',
    target: '상담 지원이 필요한 만 19~39세 청년',
    period: '분기별 모집',
    action: '상담 예약 안내',
  },
  {
    title: '청년 문화카드',
    description: '연간 10만원 상당의 문화예술 향유 기회를 제공하여 청년들의 문화 생활을 장려하고 삶의 질을 높입니다.',
    target: '천안시 거주 청년',
    period: '연 1회 신청',
    action: '사용처 보기',
  },
];

const RESOURCES = [
  { title: 'AI 자기소개서 클리닉', description: '빅데이터 분석을 통한 맞춤형 첨삭 지도', action: '서비스 이용하기', detail: '자기소개서 문항별 강점·경험 매칭과 표현 개선 포인트를 제공합니다.' },
  { title: '언택트 모의 면접', description: '화면 너머 면접관과의 실전 연습 피드백', action: '예약 신청하기', detail: '직무별 예상 질문, 답변 구조, 비언어 피드백을 온라인으로 점검합니다.' },
  { title: '청년 창업 커뮤니티', description: '지역 스타트업 네트워크 및 멘토링', action: '커뮤니티 가입', detail: '창업자 네트워킹, 멘토링, 지원사업 알림을 한곳에서 확인합니다.' },
];

const SPACES = [
  { title: '청년센터 이음', description: '성정동 위치 | 스터디룸 & 미팅룸', status: 'AVAILABLE' },
  { title: '청년 창업 거점센터', description: '불당동 위치 | 공유 오피스 & 메이커스페이스', status: 'AVAILABLE' },
  { title: '북카페 휴(休)', description: '신안동 위치 | 독서 및 휴식 전용', status: 'LIMITED' },
];

function YouthModal({ modal, onClose }) {
  if (!modal) return null;
  return (
    <div className="youth-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="youth-modal" role="dialog" aria-modal="true" aria-labelledby="youth-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="youth-modal-close" onClick={onClose} aria-label="닫기">×</button>
        <p className="youth-modal-kicker">CHEONAN YOUTH PORTAL</p>
        <h2 id="youth-modal-title">{modal.title}</h2>
        {modal.description && <p className="youth-modal-desc">{modal.description}</p>}
        <div className="youth-modal-list">
          {modal.items.map((item) => (
            <article key={item.title} className="youth-modal-item">
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                {item.target && <small>대상: {item.target}</small>}
                {item.period && <small>기간: {item.period}</small>}
                {item.detail && <small>{item.detail}</small>}
              </div>
              <span>{item.action || item.status || '상세 보기'}</span>
            </article>
          ))}
        </div>
        <div className="youth-modal-actions">
          <a href="https://www.cheonan.go.kr/" target="_blank" rel="noreferrer">천안시청에서 확인</a>
          <button type="button" onClick={onClose}>닫기</button>
        </div>
      </section>
    </div>
  );
}

export default function YouthPage() {
  const [modal, setModal] = useState(null);
  const openPolicyList = () => setModal({
    title: '청년 정책 전체 목록',
    description: '천안 청년을 위한 주거·건강·문화 지원 정책을 한 번에 확인하세요.',
    items: POLICIES,
  });
  const openPolicyDetail = (policy) => setModal({
    title: policy.title,
    description: policy.description,
    items: [policy],
  });
  const openResource = (resource) => setModal({
    title: resource.title,
    description: resource.description,
    items: [resource],
  });
  const openInternship = () => setModal({
    title: '천안 청년 인턴쉽 신청 안내',
    description: '시청, 산하기관, 관내 우수기업 실무 경험을 위한 인턴십 참여 절차입니다.',
    items: [
      { title: '지원서 작성', description: '기본 인적사항, 관심 직무, 자기소개를 작성합니다.', action: '1단계' },
      { title: '서류 확인', description: '자격 요건과 제출 서류를 담당자가 확인합니다.', action: '2단계' },
      { title: '매칭 및 안내', description: '희망 직무와 기관 수요를 바탕으로 면접·배치 일정을 안내합니다.', action: '3단계' },
    ],
  });

  return (
    <div className="youth-page youth-portal-page">
      <YouthModal modal={modal} onClose={() => setModal(null)} />
      <section className="youth-hero">
        <div className="youth-hero-stat">
          <span>지원 현황</span>
          <strong>실시간 연동</strong>
        </div>
        <p className="youth-eyebrow">CHEONAN YOUTH PORTAL</p>
        <h1>당신의 성장을 돕는<br />천안 청년 지원 공간</h1>
        <p className="youth-hero-desc">천안시의 모든 청년들이 꿈을 펼칠 수 있도록 정책부터 일자리, 공간까지 한곳에서 지원합니다.</p>
      </section>

      <section className="youth-section">
        <div className="youth-section-head">
          <p>Policy Support</p>
          <h2>천안 청년을 위한 맞춤형 정책 지원 시스템</h2>
          <button type="button" onClick={openPolicyList}>전체 보기</button>
        </div>
        <div className="youth-policy-grid">
          {POLICIES.map((policy) => (
            <article key={policy.title} className="youth-policy-card">
              <h3>{policy.title}</h3>
              <p>{policy.description}</p>
              <button type="button" className="youth-link-button" onClick={() => openPolicyDetail(policy)}>Learn More</button>
            </article>
          ))}
        </div>
      </section>

      <section className="youth-opportunity">
        <div>
          <p>Employment Resources</p>
          <span>HOT OPPORTUNITY</span>
          <h2>천안 청년<br />인턴쉽</h2>
          <p>시청, 산하기관, 관내 우수기업에서 실무 경험을 쌓고 취업 역량을 강화할 인재를 모집합니다.</p>
          <div className="youth-action-row">
            <button type="button" onClick={openInternship}>Apply Now</button>
            <button type="button" className="ghost" onClick={() => window.open('https://www.cheonan.go.kr/', '_blank', 'noopener,noreferrer')}>View PDF Guide</button>
          </div>
        </div>
        <div className="youth-resource-list">
          {RESOURCES.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <button type="button" onClick={() => openResource(item)}>{item.action}</button>
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
