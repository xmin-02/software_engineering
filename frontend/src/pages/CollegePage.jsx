import './CollegePage.css';
import collegePlaceImage1 from '../assets/figma/college-place-1.jpg';
import collegePlaceImage2 from '../assets/figma/college-place-2.jpg';
import collegePlaceImage3 from '../assets/figma/college-place-3.jpg';

const NOTICES = [
  ['단국대', '2024학년도 하계 방학 해외 연수 프로그램 안내', '학사', '2024.05.24'],
  ['호서대', '상반기 취업 역량 강화 캠프 참가자 모집 (Cheonan City)', '취업', '2024.05.22'],
  ['백석대', '제1학기 성적 확인 및 이의 신청 기간 안내', '학사', '2024.05.21'],
  ['단국대', '교내 근로 장학생 추가 모집 공고 (행정지원팀)', '장학', '2024.05.20'],
  ['상명대', "2024 대학 축제 '상명인의 밤' 부스 운영 안내", '행사', '2024.05.18'],
];

const PLACES = [
  ['도쿄스테이크 천안점', '일식', '합리적인 가격의 스테이크와 라멘 전문점', '4.8', collegePlaceImage1],
  ['단대앞 김치찜', '한식', '단국대생들의 소울푸드, 밥도둑 김치찜', '4.9', collegePlaceImage2],
  ['파스타빌리지', '양식', '천안 안서동 숨은 파스타 명가', '4.7', collegePlaceImage3],
];

export default function CollegePage() {
  return (
    <div className="college-page college-figma-page">
      <div className="college-page-head">
        <div><p>대학 공지</p><h1>대학교</h1></div>
        <span>실시간 운영 중</span>
      </div>

      <div className="filter-bar college-filter-bar">
        <button type="button" className="filter-select">전체 대학</button>
        <button type="button" className="filter-select">학사</button>
        <span className="college-sort-pill">최신순</span>
      </div>

      <div className="table-wrapper college-notice-panel">
        <table className="notice-table college-notice-table">
          <caption className="sr-only">대학교 공지 목록</caption>
          <thead><tr><th>대학교</th><th>공지 제목</th><th>카테고리</th><th>등록일</th></tr></thead>
          <tbody>
            {NOTICES.map(([university, title, category, date]) => (
              <tr key={title}>
                <td data-label="대학교"><span className="univ-badge">{university}</span></td>
                <td data-label="공지 제목">{title}</td>
                <td data-label="카테고리">{category}</td>
                <td data-label="등록일" className="youth-date-cell">{date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="college-more-btn">더 보기</button>

      <section className="places-section college-recommend-section">
        <div className="college-section-title-row">
          <div><h2 className="places-title">대학교 추천 맛집</h2><p className="places-desc">대학생들이 가장 많이 찾는 로컬 플레이스</p></div>
          <button type="button">전체 보기</button>
        </div>
        <div className="places-grid">
          {PLACES.map(([name, category, description, rating, image]) => (
            <article key={name} className="place-card college-place-card">
              <img className="college-place-image" src={image} alt="" loading="lazy" />
              <div className="college-place-rating">{rating}</div>
              <span className="place-category">{category}</span>
              <h3 className="place-name">{name}</h3>
              <p className="place-address">{description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
