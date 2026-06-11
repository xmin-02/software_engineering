export function hasCoordinates(item) {
  return Number.isFinite(Number(item?.latitude)) && Number.isFinite(Number(item?.longitude));
}

export function cleanMapAddress(address) {
  const value = String(address ?? '').trim();
  if (!value || /^전화\s*\d*/.test(value)) return '';
  if (/조회|연계|정보|전화|시스템|전 지역|일대|후보|위주|운영시간/.test(value) && !/(구|동|읍|면|로|길|번영로|대로)\s*\d*/.test(value)) {
    return '';
  }
  return value;
}

function placeLabel(item, fallback = '천안') {
  return item?.name || item?.title || fallback;
}

export function kakaoSearchUrl(item, fallback = '천안') {
  const explicitQuery = String(item?.mapQuery ?? '').trim();
  const address = cleanMapAddress(item?.address || item?.location);
  const query = explicitQuery || address || placeLabel(item, fallback);
  return `https://map.kakao.com/link/search/${encodeURIComponent(query)}`;
}

export function kakaoMapUrl(item, fallback = '천안') {
  if (hasCoordinates(item)) {
    return `https://map.kakao.com/link/map/${encodeURIComponent(placeLabel(item, fallback))},${Number(item.latitude)},${Number(item.longitude)}`;
  }
  return kakaoSearchUrl(item, fallback);
}

export function kakaoRouteUrl(item, fallback = '목적지') {
  if (hasCoordinates(item)) {
    return `https://map.kakao.com/link/to/${encodeURIComponent(placeLabel(item, fallback))},${Number(item.latitude)},${Number(item.longitude)}`;
  }
  return kakaoSearchUrl(item, fallback);
}

export function openKakaoRouteFromCurrent(item, fallback = '목적지') {
  const openDestinationOnly = () => window.open(kakaoRouteUrl(item, fallback), '_blank', 'noopener,noreferrer');
  if (!hasCoordinates(item) || !navigator.geolocation) {
    openDestinationOnly();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const url = `https://map.kakao.com/link/from/${encodeURIComponent('현위치')},${coords.latitude},${coords.longitude}/to/${encodeURIComponent(placeLabel(item, fallback))},${Number(item.latitude)},${Number(item.longitude)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    openDestinationOnly,
    { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 },
  );
}

export function staticMapUrl(item) {
  if (!hasCoordinates(item)) return null;
  const latitude = Number(item.latitude);
  const longitude = Number(item.longitude);
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=16&size=640x640&maptype=mapnik&markers=${latitude},${longitude},red-pushpin`;
}
