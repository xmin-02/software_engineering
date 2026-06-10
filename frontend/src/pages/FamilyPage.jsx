import { useCallback, useEffect, useState } from 'react';
import api from '../api/client';
import './FamilyPage.css';
import homeImage1 from '../assets/figma/home-1.jpg';
import homeImage2 from '../assets/figma/home-2.jpg';
import homeImage3 from '../assets/figma/home-3.jpg';
import familyPlaceImage1 from '../assets/figma/family-place-1.jpg';
import familyPlaceImage2 from '../assets/figma/family-place-2.jpg';
import familyPlaceImage3 from '../assets/figma/family-place-4.jpg';

const PROPERTY_TYPES = ['아파트', '빌라', '오피스텔', '단독주택', '상가'];
const TRADE_TYPES = ['매매', '전세', '월세'];
const HOME_IMAGES = [homeImage1, homeImage2, homeImage3];
const FAMILY_PLACE_IMAGES = [familyPlaceImage1, familyPlaceImage2, familyPlaceImage3];

const FIGMA_ESTATES = [
  { property_type: '아파트', deal_type: '매매', address: '천안 불당 지웰 더 샵', price: 125000, area: '112㎡ / 84', transaction_date: '2024-05-12', summary: '천안시 서북구 불당동 123-45' },
  { property_type: '오피스텔', deal_type: '월세', address: '두정역 센트럴 하이브', price: 2000, monthly_rent: 85, area: '42㎡ (12평)', transaction_date: '즉시 입주', summary: '천안시 서북구 두정동 789-1' },
  { property_type: '단독주택', deal_type: '매매', address: '성성동 힐사이드 빌리지', price: 78000, area: '198㎡ / 115', transaction_date: '마당 보유', summary: '천안시 서북구 성성동 산 22' },
];

const FIGMA_FAMILY_PLACES = [
  { name: '쁘띠 가든', category: '양식 · 패밀리레스토랑', address: '아이 동반 추천', rating: '4.8' },
  { name: '우동 팩토리', category: '일식 · 수제우동', address: '유아 의자 보유', rating: '4.6' },
  { name: '더 테이블', category: '퓨전 한식', address: '가족룸 예약 가능', rating: '4.9' },
  { name: '포레스트 키즈 카페', category: '카페 · 놀이시설', address: '실내 놀이공간', rating: '4.7' },
];

export default function FamilyPage() {
  const [estates, setEstates] = useState([]);
  const [propertyType, setPropertyType] = useState('');
  const [tradeType, setTradeType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState(null);

  const fetchEstates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (propertyType) params.property_type = propertyType;
      if (tradeType) params.deal_type = tradeType;
      const res = await api.get('/api/family/real-estate', { params });
      const items = Array.isArray(res.data) ? res.data : res.data.items ?? [];
      setEstates(items.length > 0 ? items : FIGMA_ESTATES);
    } catch {
      setEstates(FIGMA_ESTATES);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [propertyType, tradeType]);

  useEffect(() => { fetchEstates(); }, [fetchEstates]);

  useEffect(() => {
    const fetchPlaces = async () => {
      setPlacesLoading(true);
      setPlacesError(null);
      try {
        const res = await api.get('/api/places', { params: { age_group: 'family', size: 6 } });
        const items = Array.isArray(res.data) ? res.data : res.data.items ?? [];
        setPlaces(items.length > 0 ? items : FIGMA_FAMILY_PLACES);
      } catch {
        setPlaces(FIGMA_FAMILY_PLACES);
        setPlacesError(null);
      } finally {
        setPlacesLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  const formatPrice = (item) => {
    if (!item) return '-';
    if (item.deal_type === '월세') return `보증금 ${item.price?.toLocaleString?.() ?? item.price ?? '-'} / 월 ${item.monthly_rent ?? '-'}만원`;
    if (item.price == null) return '-';
    const num = Number(item.price);
    if (Number.isFinite(num) && num >= 10000) {
      const eok = Math.floor(num / 10000);
      const man = num % 10000;
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
    }
    return `${Number.isFinite(num) ? num.toLocaleString() : item.price}만원`;
  };

  return (
    <div className="family-page family-figma-page">
      <div className="family-page-head">
        <h1>가족</h1>
        <div className="family-filter-summary">
          <span>필터</span>
          <strong>거래 유형: {tradeType || '전체'}</strong>
          <strong>매물 유형: {propertyType || '전체'}</strong>
        </div>
      </div>

      <div className="filter-bar family-filter-bar">
        <label htmlFor="family-property-type" className="sr-only">매물유형 필터</label>
        <select id="family-property-type" value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="filter-select">
          <option value="">전체 매물유형</option>
          {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label htmlFor="family-trade-type" className="sr-only">거래유형 필터</label>
        <select id="family-trade-type" value={tradeType} onChange={(e) => setTradeType(e.target.value)} className="filter-select">
          <option value="">전체 거래유형</option>
          {TRADE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {loading && <p className="status-msg" aria-live="polite">데이터를 불러오는 중...</p>}
      {error && <p className="status-msg error" role="alert">{error}</p>}

      {!loading && !error && (
        <section className="family-estate-grid" aria-label="부동산 매물 정보">
          {(estates.length > 0 ? estates : FIGMA_ESTATES).slice(0, 3).map((item, index) => (
            <article key={item.id ?? index} className="family-estate-card">
              <img src={HOME_IMAGES[index % HOME_IMAGES.length]} alt="" loading="lazy" />
              <div className="family-estate-body">
                <div className="family-estate-badges">
                  <span>{item.property_type ?? '주거'}</span>
                  <span>{item.deal_type ?? '-'}</span>
                </div>
                <h2>{item.address ?? '천안시 주거 매물'}</h2>
                {item.summary && <p className="family-estate-address">{item.summary}</p>}
                <strong>{formatPrice(item)}</strong>
                <dl>
                  <div><dt>면적</dt><dd>{item.area ?? '-'}㎡</dd></div>
                  <div><dt>최근 거래일</dt><dd>{item.transaction_date?.slice(2, 10).replaceAll('-', '.') ?? '-'}</dd></div>
                </dl>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="places-section places-section--main family-places-section">
        <div className="family-section-title-row">
          <div>
            <h2 className="places-title">가족 추천 맛집</h2>
            <p className="places-desc">부동산 인근 아이와 함께 가기 좋은 식당</p>
          </div>
          <button type="button">전체보기</button>
        </div>
        {placesLoading && <p className="status-msg" aria-live="polite">맛집 정보를 불러오는 중...</p>}
        {placesError && <p className="status-msg error" role="alert">{placesError}</p>}
        {!placesLoading && !placesError && places.length > 0 && (
          <div className="places-grid">
            {(places.length > 0 ? places : FIGMA_FAMILY_PLACES).slice(0, 4).map((place, i) => (
              <article key={place.id ?? i} className="place-card family-place-card">
                <img
                  className="family-place-image"
                  src={place.image_url ?? FAMILY_PLACE_IMAGES[i % FAMILY_PLACE_IMAGES.length]}
                  alt=""
                  loading="lazy"
                  onError={(e) => { e.currentTarget.src = FAMILY_PLACE_IMAGES[i % FAMILY_PLACE_IMAGES.length]; }}
                />
                <h3 className="place-name">{place.name}</h3>
                <span className="place-category">{place.category ?? '맛집'}</span>
                <p className="place-address">{place.address ?? '천안시'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
