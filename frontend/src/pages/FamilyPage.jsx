import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import './FamilyPage.css';
import homeImage1 from '../assets/figma/home-1.jpg';
import homeImage2 from '../assets/figma/home-2.jpg';
import homeImage3 from '../assets/figma/home-3.jpg';
import familyPlaceImage1 from '../assets/figma/family-place-1.jpg';
import familyPlaceImage2 from '../assets/figma/family-place-2.jpg';
import familyPlaceImage3 from '../assets/figma/family-place-4.jpg';

const HOME_IMAGES = [homeImage1, homeImage2, homeImage3];
const FAMILY_PLACE_IMAGES = [familyPlaceImage1, familyPlaceImage2, familyPlaceImage3, familyPlaceImage1];




function formatEstatePrice(item) {
  if (item.deal_type === '월세') return `보증금 ${item.price?.toLocaleString?.() ?? '정보 없음'} / 월 ${item.monthly_rent?.toLocaleString?.() ?? '정보 없음'}`;
  if (item.deal_type === '전세') return `전세 ${item.price?.toLocaleString?.() ?? '정보 없음'}`;
  return item.price ? `${item.price.toLocaleString()}만원` : '가격 정보 없음';
}

function normalizeFamilyImage(url, fallback) {
  if (!url) return fallback;
  if (url.startsWith('https://')) return url;
  if (url.startsWith('http://')) return `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ''))}`;
  return fallback;
}

function formatPlaceRating(place) {
  const directRating = place.rating ?? place.rating_naver ?? place.rating_kakao;
  const numericRating = Number(directRating);
  if (Number.isFinite(numericRating) && numericRating > 0) return numericRating.toFixed(1);
  const sentimentScore = Number(place.avg_sentiment_score);
  if (Number.isFinite(sentimentScore)) {
    return Math.max(4.1, Math.min(4.9, 4 + sentimentScore)).toFixed(1);
  }
  return '신규';
}

function FilterModal({ onClose }) {
  const [homeType, setHomeType] = useState('아파트');
  const [dealType, setDealType] = useState('매매');
  const [area, setArea] = useState('중형\n60~85㎡');
  return (
    <div className="single-settings-overlay" onClick={onClose}>
      <section className="single-settings family-filter-modal" onClick={(event) => event.stopPropagation()}>
        <h2>상세 필터</h2>
        <div className="filter-modal-group"><h3>주거 유형</h3>{['아파트', '빌라', '원룸', '오피스텔'].map((label) => <button key={label} type="button" className={homeType === label ? 'active' : ''} onClick={() => setHomeType(label)}>{label}</button>)}</div>
        <div className="filter-modal-group"><h3>거래 유형</h3>{['매매', '전세', '월세'].map((label) => <button key={label} type="button" className={dealType === label ? 'active' : ''} onClick={() => setDealType(label)}>{label}</button>)}</div>
        <div className="filter-modal-group"><h3>가격 범위</h3><strong>5억 ~ 무제한</strong><div><span>0원</span><span>무제한</span></div></div>
        <div className="filter-modal-group"><h3>전용 면적</h3>{['소형\n60㎡ 미만', '중형\n60~85㎡', '대형\n85㎡ 초과'].map((label) => <button key={label} type="button" className={area === label ? 'active' : ''} onClick={() => setArea(label)}>{label}</button>)}</div>
        <div className="setting-actions"><button type="button" onClick={() => { setHomeType('아파트'); setDealType('매매'); setArea('중형\n60~85㎡'); }}>초기화</button><button type="button" onClick={onClose}>적용하기</button></div>
      </section>
    </div>
  );
}

export default function FamilyPage() {
  const navigate = useNavigate();
  const [filterOpen, setFilterOpen] = useState(false);
  const [homeType, setHomeType] = useState('아파트');
  const [dealType, setDealType] = useState('매매');
  const [familyPlaces, setFamilyPlaces] = useState([]);
  const [estates, setEstates] = useState([]);


  useEffect(() => {
    let ignore = false;
    api.get('/api/family/real-estate', { params: { property_type: homeType, deal_type: dealType } })
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : [];
        if (!ignore) setEstates(items.slice(0, 3));
      })
      .catch(() => { if (!ignore) setEstates([]); });
    return () => { ignore = true; };
  }, [homeType, dealType]);

  useEffect(() => {
    let ignore = false;
    api.get('/api/places', { params: { age_group: 'family', size: 8 } })
      .then((res) => {
        const items = Array.isArray(res.data) ? res.data : (res.data?.items ?? []);
        if (!ignore) setFamilyPlaces(items.slice(0, 4));
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, []);
  return (
    <div className="family-page family-figma-page">
      <div className="family-page-head">
        <h1>가족</h1>
        <button type="button" className="family-filter-open" onClick={() => setFilterOpen(true)}>필터</button>
      </div>
      <div className="filter-bar family-filter-bar">
        <button type="button" className="filter-select" onClick={() => setHomeType((value) => (value === '아파트' ? '오피스텔' : value === '오피스텔' ? '단독주택' : '아파트'))}>매물 유형: {homeType}</button>
        <button type="button" className="filter-select" onClick={() => setDealType((value) => (value === '매매' ? '월세' : value === '월세' ? '전세' : '매매'))}>거래 유형: {dealType}</button>
      </div>

      <section className="family-estate-grid" aria-label="부동산 매물 정보">
        {estates.map((item, index) => (
          <article key={item.id ?? `${item.address}-${index}`} className="family-estate-card">
            <img src={HOME_IMAGES[index % HOME_IMAGES.length]} alt="" loading="lazy" />
            <div className="family-estate-body">
              <div className="family-estate-badges"><span>{item.property_type || homeType}</span><span>{item.deal_type || dealType}</span></div>
              <h2>{item.address || '천안시 주거 매물'}</h2>
              <p className="family-estate-address">최근 실거래 데이터 기준</p>
              <strong>{formatEstatePrice(item)}</strong>
              <dl><div><dt>전용 면적</dt><dd>{item.area ? `${item.area}㎡` : '정보 없음'}</dd></div><div><dt>거래일</dt><dd>{item.transaction_date || '정보 없음'}</dd></div></dl>
            </div>
          </article>
        ))}
        {estates.length === 0 && <p className="empty-text">조건에 맞는 매물 데이터가 없습니다</p>}
      </section>

      <section className="places-section places-section--main family-places-section">
        <div className="family-section-title-row"><div><h2 className="places-title">가족 추천 맛집</h2><p className="places-desc">부동산 인근 아이와 함께 가기 좋은 식당</p></div><button type="button" onClick={() => navigate('/places')}>전체보기</button></div>
        <div className="places-grid">
          {familyPlaces.map((place, index) => (
            <article key={place.id ?? place.name} className="place-card family-place-card"><img className="family-place-image" src={normalizeFamilyImage(place.image_url || place.photo_url, FAMILY_PLACE_IMAGES[index % FAMILY_PLACE_IMAGES.length])} alt="" loading="lazy" onError={(event) => { event.currentTarget.src = FAMILY_PLACE_IMAGES[index % FAMILY_PLACE_IMAGES.length]; }} /><span className="family-place-rating">{formatPlaceRating(place) === '신규' ? '신규' : `★ ${formatPlaceRating(place)}`}</span><h3 className="place-name">{place.name}</h3><span className="place-category">{place.category}</span></article>
          ))}
        </div>
      </section>
      {filterOpen && <FilterModal onClose={() => setFilterOpen(false)} />}
    </div>
  );
}
