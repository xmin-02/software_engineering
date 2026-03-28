import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import './FamilyPage.css';

const PROPERTY_TYPES = ['아파트', '빌라', '오피스텔', '단독주택', '상가'];
const TRADE_TYPES = ['매매', '전세', '월세'];

export default function FamilyPage() {
  const [estates, setEstates] = useState([]);
  const [propertyType, setPropertyType] = useState('');
  const [tradeType, setTradeType] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 맛집 추천 상태
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState(null);

  const fetchEstates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (propertyType) params.property_type = propertyType;
      if (tradeType) params.trade_type = tradeType;
      const res = await api.get('/api/family/real-estate', { params });
      setEstates(Array.isArray(res.data) ? res.data : res.data.items ?? []);
    } catch {
      setError('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, [propertyType, tradeType]);

  useEffect(() => { fetchEstates(); }, [fetchEstates]);

  // 가족 추천 맛집 로드
  useEffect(() => {
    const fetchPlaces = async () => {
      setPlacesLoading(true);
      setPlacesError(null);
      try {
        const res = await api.get('/api/places', { params: { age_group: 'family', size: 6 } });
        setPlaces(Array.isArray(res.data) ? res.data : res.data.items ?? []);
      } catch {
        setPlacesError('맛집 데이터를 불러올 수 없습니다');
      } finally {
        setPlacesLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  const formatPrice = (price) => {
    if (price == null) return '-';
    const num = Number(price);
    if (num >= 10000) {
      const eok = Math.floor(num / 10000);
      const man = num % 10000;
      return man > 0 ? `${eok}억 ${man.toLocaleString()}만원` : `${eok}억원`;
    }
    return `${num.toLocaleString()}만원`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return dateStr.slice(0, 10);
  };

  return (
    <div className="family-page">
      <h1 className="page-title">부동산</h1>

      <div className="filter-bar">
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="filter-select"
        >
          <option value="">전체 매물유형</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={tradeType}
          onChange={(e) => setTradeType(e.target.value)}
          className="filter-select"
        >
          <option value="">전체 거래유형</option>
          {TRADE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {loading && <p className="status-msg">데이터를 불러오는 중...</p>}
      {error && <p className="status-msg error">{error}</p>}

      {!loading && !error && (
        <div className="table-wrapper">
          {estates.length === 0
            ? <p className="status-msg">아직 데이터가 없습니다</p>
            : (
              <table className="estate-table">
                <thead>
                  <tr>
                    <th>주소</th>
                    <th>매물유형</th>
                    <th>거래유형</th>
                    <th>가격</th>
                    <th>면적(㎡)</th>
                    <th>층</th>
                    <th>거래일</th>
                  </tr>
                </thead>
                <tbody>
                  {estates.map((item, i) => (
                    <tr key={item.id ?? i}>
                      <td className="address-cell">{item.address ?? '-'}</td>
                      <td><span className="type-badge">{item.property_type ?? '-'}</span></td>
                      <td><span className={`trade-badge ${item.trade_type}`}>{item.trade_type ?? '-'}</span></td>
                      <td className="price-cell">{formatPrice(item.price)}</td>
                      <td>{item.area ?? '-'}</td>
                      <td>{item.floor != null ? `${item.floor}층` : '-'}</td>
                      <td className="date-cell">{formatDate(item.transaction_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {/* 가족 추천 맛집 섹션 */}
      <div className="places-section">
        <h2 className="places-title">가족 추천 맛집</h2>
        <p className="places-desc">노키즈존 제외, 키즈시설 우선 — 온 가족이 편안한 천안 맛집</p>
        {placesLoading && <p className="status-msg">맛집 정보를 불러오는 중...</p>}
        {placesError && <p className="status-msg error">{placesError}</p>}
        {!placesLoading && !placesError && places.length === 0 && (
          <p className="status-msg">등록된 맛집이 없습니다</p>
        )}
        {!placesLoading && !placesError && places.length > 0 && (
          <div className="places-grid">
            {places.map((place, i) => (
              <div key={place.id ?? i} className="place-card">
                <h3 className="place-name">{place.name}</h3>
                {place.category && (
                  <span className="place-category">{place.category}</span>
                )}
                {place.address && (
                  <p className="place-address">{place.address}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
