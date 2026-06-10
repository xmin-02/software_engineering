import { useEffect, useState } from 'react';
import './PlacesPage.css';
import placeImage1 from '../assets/figma/place-1.jpg';
import placeImage2 from '../assets/figma/place-2.jpg';
import placeImage3 from '../assets/figma/place-3.jpg';
import placeImage4 from '../assets/figma/place-4.jpg';
import placeImage5 from '../assets/figma/place-6.jpg';

const PLACE_IMAGES = [placeImage1, placeImage2, placeImage3, placeImage4, placeImage5, placeImage1];

const FIGMA_PLACES = [
  { badge: 'CAFE', area: '신부동', name: '모던 아카이브', description: '직접 로스팅한 원두와 미니멀한 인테리어가 돋보이는 감성 카페', distance: '1.2km', status: '영업 중', rating: '4.8' },
  { badge: 'RESTAURANT', area: '불당동', name: '테이블 오브 더 시티', description: '지역 특산물을 활용한 창의적인 파인 다이닝을 경험해보세요', distance: '3.5km', status: '브레이크 타임', rating: '4.9' },
  { badge: 'KOREAN', area: '쌍용동', name: '정성 담은 한 그릇', description: '어머니의 손맛을 그대로 담은 천안식 전통 비빔밥 전문점', distance: '800m', status: '영업 중', rating: '4.6' },
  { badge: 'BAKERY', area: '백석동', name: '밀가루 공방', description: '매일 아침 갓 구운 천연 발효종 빵과 고소한 버터 향이 가득합니다', distance: '2.1km', status: '마감 임박', rating: '4.7' },
  { badge: 'JAPANESE', area: '두정동', name: '스시 하루', description: '신선한 제철 생선만을 고집하는 정통 일식 초밥 전문점입니다', distance: '4.2km', status: '영업 중', rating: '4.5' },
  { badge: 'ITALIAN', area: '청당동', name: '화덕의 미학', description: '참나무 장작으로 구워낸 쫄깃한 도우의 정통 나폴리 피자', distance: '5.5km', status: '영업 중', rating: '4.7' },
];

const REVIEWS = [
  { sentiment: '긍정', source: '네이버 블로그', date: '2024.05.20', text: '커피 향이 너무 좋고 인테리어가 정말 예뻐요! 특히 시그니처 메뉴인 슬로우 라떼는 꼭 드셔보시길 추천합니다. 분위기가 조용…' },
  { sentiment: '중립', source: '구글 맵스', date: '2024.05.18', text: '맛은 평이한 수준입니다. 사람이 많아서 조금 소란스러웠지만 직원분들은 친절하셨어요. 가격대가 약간 있는 편인 것 같습니다...' },
  { sentiment: '부정', source: '카카오맵', date: '2024.05.15', text: '주차가 너무 힘들어요. 주차장이 협류해서 주변 골목을 한참 돌았습니다. 방문하실 분들은 대중교통 이용하시는게 좋을 것 같…' },
];

function FigmaPlaceModal({ onClose }) {
  useEffect(() => {
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel figma-place-detail" role="dialog" aria-modal="true" aria-label="음식점 정보 패널" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close-btn" type="button" onClick={onClose} aria-label="닫기">✕</button>
        <div className="modal-body">
          <div className="modal-left">
            <span className="category-badge cat-카페">카페/디저트</span>
            <h2 className="modal-place-name">슬로우커피 봉명점</h2>
            <p className="modal-address">충청남도 천안시 동남구 봉명동 123-4</p>
            <div className="modal-info-row">
              <span className="modal-info-chip">영업시간 10:00 - 22:00</span>
              <span className="modal-info-chip">전화번호 041-123-4567</span>
            </div>
            <h3 className="modal-reviews-title">최근 리뷰 데이터 <span>총 1,248건</span></h3>
            <div className="modal-reviews">
              {REVIEWS.map((review) => (
                <article key={review.text} className={`modal-review-item review-border-${review.sentiment === '긍정' ? 'positive' : review.sentiment === '부정' ? 'negative' : 'neutral'}`}>
                  <div className="modal-review-header"><span className="sentiment-badge badge-neutral">{review.sentiment}</span><span>{review.source}</span><time>{review.date}</time></div>
                  <p className="modal-review-text">{review.text}</p>
                  <button type="button" className="modal-review-more">더보기</button>
                </article>
              ))}
            </div>
          </div>
          <div className="modal-right">
            <div className="modal-right-sticky"><div className="modal-map-placeholder">Kakao Map Loading...</div></div>
            <button type="button" className="dropdown-primary">관심 장소 저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlacesPage() {
  const [selected, setSelected] = useState(false);
  return (
    <div className="places-page places-figma-page">
      <div className="page-header">
        <h1 className="places-page-title">맛집 & 카페</h1>
        <span className="page-subtitle">천안시 시민들이 추천하는 로컬 큐레이션</span>
      </div>

      <div className="figma-place-controls">
        <nav className="figma-category-tabs" aria-label="맛집 카테고리">
          {['전체', '한식', '일식/중식', '카페/디저트'].map((label, index) => <button key={label} type="button" className={index === 0 ? 'active' : ''}>{label}</button>)}
        </nav>
        <div className="figma-sort-row">
          {['평점 높은 순', '가까운 거리 순', '리뷰 많은 순'].map((label, index) => <button key={label} type="button" className={index === 0 ? 'active' : ''}>{label}</button>)}
          <label className="figma-place-search"><span className="sr-only">매장 검색</span><span className="figma-placeholder-text">매장명 또는 메뉴 검색...</span><input readOnly value="" placeholder="매장명 또는 메뉴 검색..." /></label>
        </div>
      </div>

      <div className="card-grid figma-places-grid">
        {FIGMA_PLACES.map((place, index) => (
          <article key={place.name} className="place-card figma-place-card" role="button" tabIndex={0} onClick={() => setSelected(true)} onKeyDown={(event) => { if (event.key === 'Enter') setSelected(true); }}>
            <div className="place-card-image-wrap"><img src={PLACE_IMAGES[index]} alt="" className="place-card-image" loading="lazy" /><span className="place-rating-pill">★ {place.rating}</span></div>
            <div className="figma-place-meta"><span>{place.badge}</span><strong>{place.area}</strong></div>
            <h3 className="place-name">{place.name}</h3>
            <p className="place-address">{place.description}</p>
            <div className="figma-place-bottom"><span>{place.distance}</span><strong>{place.status}</strong></div>
          </article>
        ))}
      </div>
      <button type="button" className="figma-more-btn">더 많은 맛집 보기</button>
      {selected && <FigmaPlaceModal onClose={() => setSelected(false)} />}
    </div>
  );
}
