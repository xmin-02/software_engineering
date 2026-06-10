import { useState } from 'react';
import './FamilyPage.css';
import homeImage1 from '../assets/figma/home-1.jpg';
import homeImage2 from '../assets/figma/home-2.jpg';
import homeImage3 from '../assets/figma/home-3.jpg';
import familyPlaceImage1 from '../assets/figma/family-place-1.jpg';
import familyPlaceImage2 from '../assets/figma/family-place-2.jpg';
import familyPlaceImage3 from '../assets/figma/family-place-4.jpg';

const HOME_IMAGES = [homeImage1, homeImage2, homeImage3];
const FAMILY_PLACE_IMAGES = [familyPlaceImage1, familyPlaceImage2, familyPlaceImage3, familyPlaceImage1];

const FIGMA_ESTATES = [
  { property_type: '아파트', deal_type: '매매', name: '천안 불당 지웰 더 샵', address: '천안시 서북구 불당동 123-45', price: '12억 5,000만원', areaLabel: '공급/전용 면적', area: '112㎡ / 84㎡', dateLabel: '최근 거래일', date: '24.05.12' },
  { property_type: '오피스텔', deal_type: '월세', name: '두정역 센트럴 하이브', address: '천안시 서북구 두정동 789-1', price: '보증금 2,000 / 월 85', areaLabel: '면적', area: '42㎡ (12평)', dateLabel: '입주가능일', date: '즉시 입주' },
  { property_type: '단독주택', deal_type: '매매', name: '성성동 힐사이드 빌리지', address: '천안시 서북구 성성동 산 22', price: '7억 8,000만원', areaLabel: '대지 면적', area: '198㎡ / 115㎡', dateLabel: '특징', date: '마당 보유' },
];

const FIGMA_FAMILY_PLACES = [
  { name: '쁘띠 가든', category: '양식 · 패밀리레스토랑', rating: '4.8' },
  { name: '우동 팩토리', category: '일식 · 수제우동', rating: '4.6' },
  { name: '더 테이블', category: '퓨전 한식', rating: '4.9' },
  { name: '포레스트 키즈 카페', category: '카페 · 놀이시설', rating: '4.7' },
];

function FilterModal({ onClose }) {
  return (
    <div className="single-settings-overlay" onClick={onClose}>
      <section className="single-settings family-filter-modal" onClick={(event) => event.stopPropagation()}>
        <h2>상세 필터</h2>
        <div className="filter-modal-group"><h3>주거 유형</h3>{['아파트', '빌라', '원룸', '오피스텔'].map((label) => <button key={label} type="button">{label}</button>)}</div>
        <div className="filter-modal-group"><h3>거래 유형</h3>{['매매', '전세', '월세'].map((label) => <button key={label} type="button">{label}</button>)}</div>
        <div className="filter-modal-group"><h3>가격 범위</h3><strong>5억 ~ 무제한</strong><div><span>0원</span><span>무제한</span></div></div>
        <div className="filter-modal-group"><h3>전용 면적</h3>{['소형\n60㎡ 미만', '중형\n60~85㎡', '대형\n85㎡ 초과'].map((label) => <button key={label} type="button">{label}</button>)}</div>
        <div className="setting-actions"><button type="button">초기화</button><button type="button" onClick={onClose}>적용하기</button></div>
      </section>
    </div>
  );
}

export default function FamilyPage() {
  const [filterOpen, setFilterOpen] = useState(false);
  return (
    <div className="family-page family-figma-page">
      <div className="family-page-head">
        <h1>가족</h1>
        <button type="button" className="family-filter-open" onClick={() => setFilterOpen(true)}>필터</button>
      </div>
      <div className="filter-bar family-filter-bar"><button type="button" className="filter-select">매물 유형: 아파트</button><button type="button" className="filter-select">거래 유형: 매매</button></div>

      <section className="family-estate-grid" aria-label="부동산 매물 정보">
        {FIGMA_ESTATES.map((item, index) => (
          <article key={item.name} className="family-estate-card">
            <img src={HOME_IMAGES[index]} alt="" loading="lazy" />
            <div className="family-estate-body">
              <div className="family-estate-badges"><span>{item.property_type}</span><span>{item.deal_type}</span></div>
              <h2>{item.name}</h2>
              <p className="family-estate-address">{item.address}</p>
              <strong>{item.price}</strong>
              <dl><div><dt>{item.areaLabel}</dt><dd>{item.area}</dd></div><div><dt>{item.dateLabel}</dt><dd>{item.date}</dd></div></dl>
            </div>
          </article>
        ))}
      </section>

      <section className="places-section places-section--main family-places-section">
        <div className="family-section-title-row"><div><h2 className="places-title">가족 추천 맛집</h2><p className="places-desc">부동산 인근 아이와 함께 가기 좋은 식당</p></div><button type="button">전체보기</button></div>
        <div className="places-grid">
          {FIGMA_FAMILY_PLACES.map((place, index) => (
            <article key={place.name} className="place-card family-place-card"><img className="family-place-image" src={FAMILY_PLACE_IMAGES[index]} alt="" loading="lazy" /><span className="family-place-rating">{place.rating}</span><h3 className="place-name">{place.name}</h3><span className="place-category">{place.category}</span></article>
          ))}
        </div>
      </section>
      {filterOpen && <FilterModal onClose={() => setFilterOpen(false)} />}
    </div>
  );
}
