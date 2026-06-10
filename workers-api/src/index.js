import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());

const RECENT_DAYS = 30;
const TOPIC_DAYS = 7;
const PLACE_FETCH_LIMIT = 1000;
const CHEONAN_CENTER = { latitude: 36.8151, longitude: 127.1139 };
const BAD_IMAGE_HOSTS = ['imgnews.naver.net', 'ssl.pstatic.net/static', 'ssl.pstatic.net/imgstock', 'cdninstagram.com', 'fbcdn.net', 'pup-post-phinf.pstatic.net', 'ssproxy.ucloudbiz.olleh.com', 'ak-d.tripcdn.com', 'file.albamon.com'];
const BAD_IMAGE_TERMS = ['instar--', 'profile_thumb', 'tripcdn', 'hotel', 'motel'];
const FOOD_CATEGORY_ALIASES = ['한식', '중식', '일식', '양식', '분식', '음식점', '패스트푸드', '카페', '카페,디저트', '간식', '이탈리아음식', '아시아음식', '패밀리레스토랑', '도시락', '치킨', '퓨전요리'];
const UNIVERSITY_CATEGORY_ALIASES = {
	학사: ['학사', '일반', '대플', '교수학습개발원', '교양대학', '입학관리처'],
	취업: ['취업', '취업팀', '학생역량관리센터'],
	장학: ['장학', '학생장학팀', '국가장학', '교내장학', '학자금대출'],
	행사: ['행사', '특강', '사회봉사센터', '인성개발원', '실용음악트랙', '백석대학 합창단'],
};
const CHEONAN_AREAS = ['쌍용', '불당', '신부', '성정', '두정', '백석', '안서', '봉명', '대흥', '신방', '청당', '성환', '병천', '목천', '직산', '성거', '입장', '풍세', '광덕', '구성', '다가', '유량'];
const REVIEW_BLOCK_TERMS = ['네일', '알레르망', '화장품', '공장', '유튜브', 'youtu.be', 'story.kakao.com', '금호김영집', '부처님', '법을 전파', '주상복합', '돌담길', '어학원', '학원', '입시', '강의실', '백화점 6층', '캐럿21빌딩', '광고', '협찬', '제공받', '원고료', '체험단'];
const FOOD_REVIEW_TERMS = ['맛있', '맛집', '메뉴', '음식', '초밥', '김밥', '떡볶', '카페', '커피', '디저트', '고기', '매장'];
const TOPIC_BLOCK_TERMS = ['견적', '이사', '이삿짐', '화환', '근조', '장례', '000원', '특가', '할인', '전국서비스', '당일배송', '삼정엔지니어링', '수행사례', '비상주', '상담', '선임비용', '전자담배', '미용실', '필라테스', '홈페이지', '가입하기', '수수료', '시공', '설치', '교체', '납품', '업체', '사다리차', '정책자금', '대출', '보험', '영업시간', '법률', '대리인', '토목설계', '부지조성', '오늘도여행', '쉐어하우스', '원룸', '졸작', '고유가지원금', '가전', '중고폰'];
const TOPIC_ALLOW_TERMS = ['맛집', '카페', '축제', '행사', '공원', '교통', '주차', '전세', '병원', '약국', '학교', '천안시청', '동물복지', '환경', '터미널', '독립기념관', '수신메론', '성정', '두정', '불당', '백석', '신부'];
const TOPIC_MIN_ITEMS = 5;
const TOPIC_LIMIT = 15;

const sanitizeImageUrl = (url) => {
	if (!url) return null;
	const value = String(url);
	const lower = value.toLowerCase();
	return BAD_IMAGE_HOSTS.some((host) => lower.includes(host)) || BAD_IMAGE_TERMS.some((term) => lower.includes(term)) ? null : value;
};

const compactSql = (expr) => `replace(replace(replace(lower(${expr}), ' ', ''), char(10), ''), char(13), '')`;
const blockSql = (expr, terms) => {
	const compactExpr = compactSql(expr);
	return terms.map((term) => `${compactExpr} NOT LIKE '%${String(term).toLowerCase().replace(/\s+/g, '')}%'`).join(' AND ');
};
const reviewRelevanceSql = (reviewAlias = 'r', placeAlias = 'p', options = {}) => {
	const compactReview = compactSql(`${reviewAlias}.review_text`);
	const compactName = compactSql(`${placeAlias}.name`);
	const areaClauses = CHEONAN_AREAS.map((area) => `(${placeAlias}.address LIKE '%${area}%' AND instr(${compactReview}, '${area}') > 0)`).join(' OR ');
	const noKnownArea = CHEONAN_AREAS.map((area) => `${placeAlias}.address NOT LIKE '%${area}%'`).join(' AND ');
	const blockClauses = REVIEW_BLOCK_TERMS.map((term) => `${compactReview} NOT LIKE '%${term.toLowerCase().replace(/\s+/g, '')}%'`).join(' AND ');
	const foodClauses = FOOD_REVIEW_TERMS.map((term) => `${compactReview} LIKE '%${term.toLowerCase().replace(/\s+/g, '')}%'`).join(' OR ');
	const areaFilter = options.requireArea ? `AND ((${noKnownArea}) OR ${areaClauses})` : '';
	return `
		${reviewAlias}.place_id = ${placeAlias}.id
		AND ${placeAlias}.name IS NOT NULL
		AND ${reviewAlias}.review_text IS NOT NULL
		AND instr(${compactReview}, ${compactName}) > 0
		AND (${foodClauses})
		${areaFilter}
		AND ${blockClauses}
	`;
};

const toInt = (value, fallback = 0) => {
	const n = parseInt(value, 10);
	return Number.isFinite(n) ? n : fallback;
};

const clampPageSize = (value, fallback = 20) => Math.min(Math.max(toInt(value, fallback), 1), 200);

const parseJson = (value, fallback = null) => {
	if (value == null || value === '') return fallback;
	if (typeof value !== 'string') return value;
	try {
		return JSON.parse(value);
	} catch {
		return fallback;
	}
};

const parseDateOnly = (value) => (value ? String(value).slice(0, 10) : null);

const categoryAliases = (category) => {
	if (!category) return [];
	const normalized = String(category).trim();
	if (!normalized) return [];
	if (['카페/디저트', '카페,디저트', '디저트', '카페 · 디저트', '카페·디저트'].includes(normalized)) {
		return ['카페', '카페,디저트', '간식'];
	}
	if (['cafe', 'coffee', 'dessert', 'bakery'].includes(normalized.toLowerCase())) {
		return ['카페', '카페,디저트', '간식'];
	}
	if (['맛집', '맛집/카페', '맛집 · 카페', '맛집·카페', '식당'].includes(normalized) || ['restaurant', 'food', 'places'].includes(normalized.toLowerCase())) {
		return FOOD_CATEGORY_ALIASES;
	}
	if (['일식/중식', '일식 · 중식', '일식·중식'].includes(normalized)) {
		return ['일식', '중식'];
	}
	return [normalized];
};

const addCategoryFilter = (where, params, column, category) => {
	const aliases = categoryAliases(category);
	if (!aliases.length) return;
	where.push(`${column} IN (${aliases.map(() => '?').join(',')})`);
	params.push(...aliases);
};

const latestPostDate = async (db) => {
	const row = await db.prepare('SELECT date(MAX(published_at)) AS latest FROM posts WHERE published_at IS NOT NULL').first();
	return row?.latest || null;
};

const topicDateFilter = (latest, period = 'weekly', days = TOPIC_DAYS) => {
	if (!latest) return { sql: '', params: [] };
	if (period === 'today') return { sql: 'AND date(p.published_at)=date(?)', params: [latest] };
	return { sql: `AND date(p.published_at)>=date(?, '-${days} days')`, params: [latest] };
};

const topicAllowSql = () => {
	const allowed = TOPIC_ALLOW_TERMS.map((term) => `a.topic LIKE '%${term}%' OR p.title LIKE '%${term}%'`).join(' OR ');
	return `(${allowed})`;
};

const fetchTopicRows = async (db, { latest, period = 'weekly', minCount = 2, days = TOPIC_DAYS, limit = TOPIC_LIMIT } = {}) => {
	const filter = topicDateFilter(latest, period, days);
	const sourceWeight = "CASE p.source WHEN 'cheonan_city' THEN 3 WHEN 'dcinside' THEN 2 WHEN 'naver_blog' THEN 0.5 ELSE 1 END";
	const rows = await db.prepare(
		`SELECT
			a.topic AS name,
			COUNT(*) AS post_count,
			ROUND(SUM(${sourceWeight}), 1) AS score,
			GROUP_CONCAT(DISTINCT p.source) AS sources,
			MAX(p.published_at) AS latest
		FROM analysis a
		JOIN posts p ON a.post_id=p.id
		WHERE a.topic IS NOT NULL
			AND a.topic!='기타'
			AND ${blockSql('a.topic', TOPIC_BLOCK_TERMS)}
			AND ${blockSql('p.title', TOPIC_BLOCK_TERMS)}
			AND ${topicAllowSql()}
			${filter.sql}
		GROUP BY a.topic
		HAVING post_count >= ${Math.max(toInt(minCount, 1), 1)}
		ORDER BY score DESC, latest DESC
		LIMIT ${Math.max(toInt(limit, TOPIC_LIMIT), TOPIC_MIN_ITEMS)}`,
	)
		.bind(...filter.params)
		.all();
	return rows.results;
};

const displayTopicName = (name) => {
	const text = String(name || '');
	if (/동물복지|축산과/.test(text)) return '천안시 동물복지팀 칭찬';
	if (/환경위생|청소팀|서북구청/.test(text)) return '서북구청 환경위생과 민원';
	if (/주무관|천안시청|시청/.test(text)) return '천안시 시민 칭찬 민원';
	if (/구급차|소방차|터미널/.test(text)) return '터미널 인근 긴급차량 출동';
	if (/전세|출퇴근/.test(text)) return '천안 전세·출퇴근 지역 문의';
	if (/주차/.test(text)) return '성정동 주차 불편';
	if (/인구수|대전보다|실거주|천안은/.test(text)) return '천안 생활권·정주 여론';
	return text;
};

const mergeTopicRows = (...groups) => {
	const seen = new Set();
	const merged = [];
	for (const group of groups) {
		for (const row of group) {
			const displayName = displayTopicName(row.name);
			const key = displayName.replace(/\s+/g, '').toLowerCase();
			if (seen.has(key)) continue;
			seen.add(key);
			merged.push({ ...row, raw_name: row.name, name: displayName });
		}
	}
	return merged.slice(0, TOPIC_LIMIT);
};

const latestDataDate = async (db, table, column) => {
	const row = await db.prepare(`SELECT date(MAX(${column})) AS latest FROM ${table} WHERE ${column} IS NOT NULL`).first();
	return row?.latest || null;
};

const koreaNow = () => new Date(Date.now() + 9 * 60 * 60 * 1000);
const dayNameKo = (date = koreaNow()) => ['일', '월', '화', '수', '목', '금', '토'][date.getUTCDay()];
const dayNameEn = (date = koreaNow()) => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getUTCDay()];

const minutesFromTime = (value) => {
	if (!value) return null;
	const match = String(value).match(/(\d{1,2}):(\d{2})/);
	if (!match) return null;
	return Number(match[1]) * 60 + Number(match[2]);
};

const normalizeBusinessHours = (businessHours) => {
	const data = parseJson(businessHours, businessHours);
	if (!data) return null;
	if (typeof data === 'string') return { raw: data };
	return data;
};

const hoursTextForToday = (hours, date = koreaNow()) => {
	if (!hours || typeof hours !== 'object') return null;
	const day = dayNameKo(date);
	const dayEn = dayNameEn(date);
	return hours[day] || hours[`${day}요일`] || hours[dayEn] || hours.today || hours.everyday || hours.daily || hours.raw || null;
};

const isOpenNow = (businessHours, date = koreaNow()) => {
	const hours = normalizeBusinessHours(businessHours);
	const text = hoursTextForToday(hours, date);
	if (!text) return false;
	const value = String(text).trim();
	if (/휴무|closed|쉬는/i.test(value)) return false;
	if (/24\s*시간|24h|연중무휴/i.test(value)) return true;
	const ranges = [...value.matchAll(/(\d{1,2}:\d{2})\s*[~\-–]\s*(\d{1,2}:\d{2})/g)];
	if (!ranges.length) return true;
	const now = date.getUTCHours() * 60 + date.getUTCMinutes();
	return ranges.some(([, start, end]) => {
		const s = minutesFromTime(start);
		const e = minutesFromTime(end);
		if (s == null || e == null) return false;
		return e < s ? now >= s || now <= e : now >= s && now <= e;
	});
};

const parseKeywords = (row) => ({ ...row, keywords: parseJson(row.keywords, null) });

app.get('/api/health', (c) => c.json({ ok: true, service: 'cheonan-api', data: 'd1' }));

const distanceKm = (lat, lon, origin = CHEONAN_CENTER) => {
	const latitude = Number(lat);
	const longitude = Number(lon);
	if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
	const toRad = (value) => (value * Math.PI) / 180;
	const dLat = toRad(latitude - origin.latitude);
	const dLon = toRad(longitude - origin.longitude);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(origin.latitude)) * Math.cos(toRad(latitude)) * Math.sin(dLon / 2) ** 2;
	return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const placeDistanceLabel = (row) => {
	const km = distanceKm(row.latitude, row.longitude);
	if (km == null) return null;
	return `${km < 10 ? km.toFixed(1) : Math.round(km).toLocaleString()}km`;
};

const normalizePlaceKey = (row) => {
	const name = String(row.name || '').replace(/\s+/g, '').replace(/천안점|천안|본점|점$/g, '').toLowerCase();
	const area = String(row.address || '').match(/(불당동|신부동|쌍용동|백석동|두정동|청당동|성정동|봉명동|대흥동|신방동|안서동|성환읍|병천면|목천읍|직산읍|성거읍|입장면|풍세면|광덕면)/)?.[1] || '';
	return `${name}:${area}`;
};

const dedupePlaces = (items) => {
	const seen = new Set();
	return items.filter((item) => {
		const key = normalizePlaceKey(item);
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
};

const placeResponse = async (db, row) => {
	const tags = await db.prepare('SELECT tag FROM place_tags WHERE place_id=?').bind(row.id).all();
	const business_hours = normalizeBusinessHours(row.business_hours);
	return {
		...row,
		is_open_now: isOpenNow(row.business_hours),
		tags: tags.results.map((t) => t.tag),
		business_hours,
		rating: row.rating_naver ?? row.rating_kakao ?? null,
		distance: placeDistanceLabel(row),
	};
};

const noticeItem = (notice) => ({
	id: notice.id,
	title: notice.title,
	subtitle: notice.university,
	description: notice.category,
	meta: parseDateOnly(notice.published_at)?.replaceAll('-', '.') ?? null,
	url: notice.url,
});

const placeInfoItem = (place) => {
	const rating = place.rating_naver ?? place.rating_kakao ?? place.rating ?? null;
	return {
		id: place.id,
		title: place.name,
		subtitle: place.category,
		description: place.address,
		meta: rating ? `평점 ${rating}` : '평점 정보 없음',
		image_url: sanitizeImageUrl(place.image_url),
	};
};

const estateAddress = (item) => [item.district, item.dong, item.title].filter(Boolean).join(' ') || item.address || '천안시';
const estatePrice = (item) => {
	if (item.deal_type === '월세') return `보증금 ${item.deposit || '-'}만원 / 월 ${item.monthly_rent || '-'}만원`;
	if (item.deal_type === '전세') return `전세 ${item.deposit || item.price || '-'}만원`;
	return `${item.price || item.deposit || '-'}만원`;
};
const estateItem = (item) => ({
	id: item.id,
	title: estateAddress(item),
	subtitle: item.deal_type,
	description: `${item.property_type || '주거'} · ${item.area_sqm || '-'}㎡ · ${item.floor || '-'}층`,
	meta: estatePrice(item),
});

const OFFICIAL_LINKS = {
	accessibility: [
		{ label: '천안시청 복지', url: 'https://www.cheonan.go.kr/' },
		{ label: '공공데이터포털', url: 'https://www.data.go.kr/' },
	],
	'high-school': [
		{ label: '천안시청소년재단', url: 'https://cayf.or.kr/' },
		{ label: '천안교육지원청', url: 'https://www.cncae.go.kr/' },
	],
	medical: [
		{ label: '천안시 동남구보건소', url: 'https://www.cheonan.go.kr/dhealth.do' },
		{ label: '응급의료포털 E-Gen', url: 'https://www.e-gen.or.kr/' },
	],
	'foreign-life': [
		{ label: '천안시청', url: 'https://www.cheonan.go.kr/' },
		{ label: '다누리 포털', url: 'https://www.liveinkorea.kr/' },
	],
	'single-household': [
		{ label: '복지로', url: 'https://www.bokjiro.go.kr/' },
		{ label: '천안시청', url: 'https://www.cheonan.go.kr/' },
	],
};

app.get('/', (c) => c.text('Cheonan API'));
app.get('/health', (c) => c.json({ status: 'ok' }));

// === Dashboard ===

app.get('/api/posts', async (c) => {
	const { source, sentiment, date_from, date_to, page = '1', size = '20' } = c.req.query();
	const limit = clampPageSize(size);
	const pageNum = Math.max(toInt(page, 1), 1);
	const offset = (pageNum - 1) * limit;
	const where = [];
	const params = [];
	if (source) {
		where.push('p.source = ?');
		params.push(source);
	}
	if (sentiment) {
		where.push('a.sentiment = ?');
		params.push(sentiment);
	}
	if (date_from) {
		where.push('p.published_at >= ?');
		params.push(date_from);
	}
	if (date_to) {
		where.push('p.published_at <= ?');
		params.push(date_to);
	}
	const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';
	const total = await c.env.DB.prepare(`SELECT COUNT(*) AS cnt FROM posts p LEFT JOIN analysis a ON p.id=a.post_id ${wc}`)
		.bind(...params)
		.first('cnt');
	const rows = await c.env.DB.prepare(
		`SELECT p.id,p.source,p.title,p.content,p.author,p.url,p.published_at,a.sentiment,a.sentiment_score,a.topic,a.keywords FROM posts p LEFT JOIN analysis a ON p.id=a.post_id ${wc} ORDER BY p.published_at DESC, p.id DESC LIMIT ? OFFSET ?`,
	)
		.bind(...params, limit, offset)
		.all();
	return c.json({ items: rows.results.map(parseKeywords), total: total || 0, page: pageNum, size: limit });
});

app.get('/api/stats/sentiment', async (c) => {
	const { source, date_from, date_to } = c.req.query();
	const where = [];
	const params = [];
	if (source) {
		where.push('p.source = ?');
		params.push(source);
	}
	if (date_from) {
		where.push('p.published_at >= ?');
		params.push(date_from);
	}
	if (date_to) {
		where.push('p.published_at <= ?');
		params.push(date_to);
	}
	const join = where.length ? 'JOIN posts p ON a.post_id=p.id' : '';
	const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';
	const row = await c.env.DB.prepare(
		`SELECT COUNT(CASE WHEN a.sentiment='positive' THEN 1 END) AS positive, COUNT(CASE WHEN a.sentiment='negative' THEN 1 END) AS negative, COUNT(CASE WHEN a.sentiment='neutral' THEN 1 END) AS neutral, COUNT(*) AS total FROM analysis a ${join} ${wc}`,
	)
		.bind(...params)
		.first();
	return c.json(row);
});

app.get('/api/stats/trend', async (c) => {
	const { interval = 'daily', source, date_from, date_to } = c.req.query();
	const dateExpr = interval === 'weekly' ? "strftime('%Y-%W', p.published_at)" : 'date(p.published_at)';
	const where = ['p.published_at IS NOT NULL'];
	const params = [];
	if (date_from) {
		where.push('p.published_at >= ?');
		params.push(date_from);
	} else {
		const latest = await latestPostDate(c.env.DB);
		if (latest) {
			where.push(`date(p.published_at) >= date(?, '-${RECENT_DAYS} days')`);
			params.push(latest);
		}
	}
	if (date_to) {
		where.push('p.published_at <= ?');
		params.push(date_to);
	}
	if (source) {
		where.push('p.source = ?');
		params.push(source);
	}
	const rows = await c.env.DB.prepare(
		`SELECT ${dateExpr} AS date, COUNT(CASE WHEN a.sentiment='positive' THEN 1 END) AS positive, COUNT(CASE WHEN a.sentiment='negative' THEN 1 END) AS negative, COUNT(CASE WHEN a.sentiment='neutral' THEN 1 END) AS neutral FROM analysis a JOIN posts p ON a.post_id=p.id WHERE ${where.join(' AND ')} GROUP BY date ORDER BY date`,
	)
		.bind(...params)
		.all();
	return c.json(rows.results);
});

app.get('/api/stats/sources', async (c) => {
	const rows = await c.env.DB.prepare(
		`SELECT p.source, COUNT(CASE WHEN a.sentiment='positive' THEN 1 END) AS positive, COUNT(CASE WHEN a.sentiment='negative' THEN 1 END) AS negative, COUNT(CASE WHEN a.sentiment='neutral' THEN 1 END) AS neutral FROM analysis a JOIN posts p ON a.post_id=p.id GROUP BY p.source`,
	).all();
	return c.json(rows.results);
});

app.get('/api/topics', async (c) => {
	const { period = 'weekly' } = c.req.query();
	const latest = await latestPostDate(c.env.DB);
	const primary = await fetchTopicRows(c.env.DB, { latest, period, minCount: 2, limit: TOPIC_LIMIT });
	const fallbackWeekly = primary.length < TOPIC_MIN_ITEMS ? await fetchTopicRows(c.env.DB, { latest, period: 'weekly', minCount: 1, limit: TOPIC_LIMIT }) : [];
	const fallbackRecent = primary.length + fallbackWeekly.length < TOPIC_MIN_ITEMS ? await fetchTopicRows(c.env.DB, { latest, period: 'weekly', minCount: 1, days: RECENT_DAYS, limit: TOPIC_LIMIT }) : [];
	const rows = mergeTopicRows(primary, fallbackWeekly, fallbackRecent);
	return c.json(rows.map((r, i) => ({ id: i + 1, ...r, keywords: [], sentiment: null, sources: r.sources ? String(r.sources).split(',') : [] })));
});

app.get('/api/topics/:id/posts', async (c) => {
	const tid = toInt(c.req.param('id'), 0);
	const latest = await latestPostDate(c.env.DB);
	const primary = await fetchTopicRows(c.env.DB, { latest, period: 'weekly', minCount: 2, limit: TOPIC_LIMIT });
	const fallbackWeekly = primary.length < TOPIC_MIN_ITEMS ? await fetchTopicRows(c.env.DB, { latest, period: 'weekly', minCount: 1, limit: TOPIC_LIMIT }) : [];
	const fallbackRecent = primary.length + fallbackWeekly.length < TOPIC_MIN_ITEMS ? await fetchTopicRows(c.env.DB, { latest, period: 'weekly', minCount: 1, days: RECENT_DAYS, limit: TOPIC_LIMIT }) : [];
	const topics = mergeTopicRows(primary, fallbackWeekly, fallbackRecent);
	const topic = topics[tid - 1];
	if (!topic) return c.json([]);
	const rows = await c.env.DB.prepare(
		'SELECT p.id,p.source,p.title,p.content,p.author,p.url,p.published_at,a.sentiment,a.sentiment_score,a.topic,a.keywords FROM analysis a JOIN posts p ON a.post_id=p.id WHERE a.topic=? ORDER BY p.published_at DESC, p.id DESC LIMIT 50',
	)
		.bind(topic.raw_name || topic.name)
		.all();
	return c.json(rows.results.map(parseKeywords));
});

app.get('/api/keywords', async (c) => {
	const { limit = '50' } = c.req.query();
	const latest = await latestPostDate(c.env.DB);
	const rows = await c.env.DB.prepare(
		`SELECT a.keywords
		FROM analysis a
		JOIN posts p ON p.id=a.post_id
		WHERE a.keywords IS NOT NULL
			AND p.source IN ('dcinside', 'cheonan_city')
			${latest ? `AND date(p.published_at)>=date(?, '-${RECENT_DAYS} days')` : ''}
		LIMIT 2000`,
	)
		.bind(...(latest ? [latest] : []))
		.all();
	const freq = {};
	const spam = [
		'견적',
		'000원',
		'전화상담',
		'무료견적',
		'신속처리',
		'안전운송',
		'친절서비스',
		'꽃집',
		'화환',
		'근조',
		'장례',
		'이사',
		'납품',
		'대여',
		'교체',
		'수리',
		'시공',
		'예식장',
		'결혼축하',
		'사다리차',
		'비상주사무실',
		'싱크대',
		'페인트',
		'미용실',
		'피부관리',
		'휴대폰성지',
		'인테리어',
		'에어컨',
		'보일러',
		'정책자금',
		'대출',
		'보험',
		'영업시간',
		'공장경매',
		'경매',
		'원룸',
		'입주청소',
		'방충망',
		'피부과',
		'변호사',
		'출장',
		'공인중개사',
		'웨딩컨벤션',
		'인기상품',
		'당일3시간',
		'전화번호',
		'주소',
		'연락처',
		'nikon',
		'open',
		'안녕하세요',
		'발생하더라도',
		'확산되지',
		'이용주의사항',
	];
	for (const row of rows.results) {
		const kws = parseJson(row.keywords, []);
		if (Array.isArray(kws)) {
			const blockTerms = [...spam, ...TOPIC_BLOCK_TERMS];
			for (const kw of kws) {
				const compactKw = String(kw || '').replace(/\s+/g, '');
				if (compactKw && !blockTerms.some((s) => compactKw.includes(String(s).replace(/\s+/g, '')))) {
					freq[kw] = (freq[kw] || 0) + 1;
				}
			}
		}
	}
	const sorted = Object.entries(freq)
		.sort((a, b) => b[1] - a[1])
		.slice(0, toInt(limit, 50));
	return c.json(sorted.map(([keyword, count]) => ({ keyword, count })));
});

app.get('/api/summaries', async (c) => {
	const rows = await c.env.DB.prepare('SELECT * FROM weekly_summaries ORDER BY week_start DESC LIMIT 10').all();
	return c.json(
		rows.results.map((r) => ({ ...r, top_topics: parseJson(r.top_topics, null), sentiment_ratio: parseJson(r.sentiment_ratio, null) })),
	);
});

// === Places ===

app.get('/api/places', async (c) => {
	const { category, age_group, open_now, page = '1', size = '20', sort_by = 'sentiment_score' } = c.req.query();
	const pageNum = Math.max(toInt(page, 1), 1);
	const limit = clampPageSize(size);
	const offset = (pageNum - 1) * limit;
	const where = [];
	const params = [];
	if (category) addCategoryFilter(where, params, 'p.category', category);
	else {
		where.push(`p.category IN (${FOOD_CATEGORY_ALIASES.map(() => '?').join(',')})`);
		params.push(...FOOD_CATEGORY_ALIASES);
	}
	where.push("length(trim(p.name)) > 1");
	if (age_group === 'youth') where.push("p.category NOT IN ('술집','주점')");
	if (age_group === 'family') where.push("p.id NOT IN (SELECT place_id FROM place_tags WHERE tag='노키즈존')");
	if (age_group === 'college') where.push("p.id IN (SELECT place_id FROM place_tags WHERE tag IN ('가성비','카공','데이트','단체석'))");
	if (age_group === 'family') where.push("p.id IN (SELECT place_id FROM place_tags WHERE tag IN ('가족','키즈시설'))");
	const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';
	const relevantReviewWhere = reviewRelevanceSql('r', 'p');
	const avgRelevantScore = `(SELECT AVG(r.sentiment_score) FROM place_reviews r WHERE ${relevantReviewWhere})`;
	const relevantReviewCount = `(SELECT COUNT(*) FROM place_reviews r WHERE ${relevantReviewWhere})`;
	const distanceOrder = `(CASE WHEN p.latitude IS NULL OR p.longitude IS NULL THEN 999999 ELSE ((p.latitude - ${CHEONAN_CENTER.latitude}) * (p.latitude - ${CHEONAN_CENTER.latitude}) + (p.longitude - ${CHEONAN_CENTER.longitude}) * (p.longitude - ${CHEONAN_CENTER.longitude})) END)`;
	const orderBy =
		sort_by === 'rating'
			? 'COALESCE(p.rating_naver, p.rating_kakao, avg_sentiment_score, 0) DESC, p.id ASC'
			: sort_by === 'review_count'
				? 'review_count DESC, COALESCE(avg_sentiment_score, 0) DESC, p.id ASC'
				: sort_by === 'distance'
					? `${distanceOrder} ASC, COALESCE(avg_sentiment_score, 0) DESC, p.id ASC`
					: 'COALESCE(avg_sentiment_score, 0) DESC, review_count DESC, p.id ASC';
	const baseSelect = `
		SELECT
			p.*,
			COALESCE(${avgRelevantScore}, 0) AS avg_sentiment_score,
			${relevantReviewCount} AS review_count,
			COALESCE(GROUP_CONCAT(DISTINCT pt.tag), '') AS tag_list
		FROM places p
		LEFT JOIN place_tags pt ON pt.place_id = p.id
		${wc}
		GROUP BY p.id
		ORDER BY ${orderBy}
	`;
	const toPlace = (row) => ({
		...row,
		image_url: sanitizeImageUrl(row.image_url),
		tags: row.tag_list ? String(row.tag_list).split(',').filter(Boolean) : [],
		business_hours: normalizeBusinessHours(row.business_hours),
		is_open_now: isOpenNow(row.business_hours),
		rating: row.rating_naver ?? row.rating_kakao ?? null,
		distance: placeDistanceLabel(row),
		tag_list: undefined,
	});

	if (open_now === 'true') {
		const rows = await c.env.DB.prepare(`${baseSelect} LIMIT ?`).bind(...params, Math.min(PLACE_FETCH_LIMIT, 500)).all();
		const filtered = dedupePlaces(rows.results.map(toPlace)).filter((row) => row.is_open_now);
		const pageItems = filtered.slice(offset, offset + limit);
		return c.json({ items: pageItems, total: filtered.length, page: pageNum, size: limit, has_next: offset + limit < filtered.length });
	}

	const rows = await c.env.DB.prepare(`${baseSelect} LIMIT ?`).bind(...params, PLACE_FETCH_LIMIT).all();
	const filtered = dedupePlaces(rows.results.map(toPlace));
	const pageItems = filtered.slice(offset, offset + limit);
	return c.json({ items: pageItems, total: filtered.length, page: pageNum, size: limit, has_next: offset + limit < filtered.length });
});

app.get('/api/places/ranking', async (c) => {
	const { category, limit = '10' } = c.req.query();
	const maxRows = clampPageSize(limit, 10);
	let where = '';
	const params = [];
	if (category) {
		const aliases = categoryAliases(category);
		where = `WHERE p.category IN (${aliases.map(() => '?').join(',')})`;
		params.push(...aliases);
	}
	params.push(maxRows);
	const relevance = reviewRelevanceSql('r', 'p');
	const rows = await c.env.DB.prepare(
		`SELECT p.id,p.name,p.category,p.address,p.image_url,p.rating_naver,p.rating_kakao, AVG(r.sentiment_score) AS avg_sentiment_score, COUNT(r.id) AS review_count FROM places p JOIN place_reviews r ON p.id=r.place_id ${where ? `${where} AND ${relevance}` : `WHERE ${relevance}`} GROUP BY p.id HAVING COUNT(r.id)>=2 ORDER BY avg_sentiment_score DESC LIMIT ?`,
	)
		.bind(...params)
		.all();
	return c.json(rows.results);
});

app.get('/api/places/:id', async (c) => {
	const id = toInt(c.req.param('id'), 0);
	const reviewLimit = clampPageSize(c.req.query('review_limit') || '100', 100);
	const place = await c.env.DB.prepare('SELECT * FROM places WHERE id=?').bind(id).first();
	if (!place) return c.json({ error: 'Not found' }, 404);
	const reviews = await c.env.DB.prepare(
		`SELECT r.* FROM place_reviews r
		 JOIN places p ON p.id=r.place_id
		 WHERE r.place_id=?
		   AND ${reviewRelevanceSql('r', 'p', { requireArea: true })}
		 ORDER BY r.published_at DESC LIMIT ?`,
	)
		.bind(id, reviewLimit)
		.all();
	const tags = await c.env.DB.prepare('SELECT tag FROM place_tags WHERE place_id=?').bind(id).all();
	const stats = await c.env.DB.prepare(
		`SELECT AVG(r.sentiment_score) AS avg_score, COUNT(*) AS cnt
		 FROM place_reviews r
		 JOIN places p ON p.id=r.place_id
		 WHERE r.place_id=?
		   AND ${reviewRelevanceSql('r', 'p', { requireArea: true })}`,
	)
		.bind(id)
		.first();
	return c.json({
		place: {
			...place,
			image_url: sanitizeImageUrl(place.image_url),
			is_open_now: isOpenNow(place.business_hours),
			tags: tags.results.map((t) => t.tag),
			avg_sentiment_score: stats?.avg_score,
			review_count: stats?.cnt || 0,
			business_hours: normalizeBusinessHours(place.business_hours),
			rating: place.rating_naver ?? place.rating_kakao ?? null,
		},
		reviews: reviews.results.map(parseKeywords),
	});
});

// === Content ===

app.get('/api/events', async (c) => {
	const { category } = c.req.query();
	const latest = await latestDataDate(c.env.DB, 'events', 'start_date');
	const where = [];
	const params = [];
	if (latest) {
		where.push('(end_date >= date(?) OR end_date IS NULL)');
		params.push(latest);
	}
	if (category) {
		where.push('category = ?');
		params.push(category);
	}
	const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';
	const rows = await c.env.DB.prepare(
		`SELECT * FROM events ${wc} ORDER BY CASE WHEN start_date IS NULL THEN 1 ELSE 0 END, start_date ASC LIMIT 50`,
	)
		.bind(...params)
		.all();
	return c.json(rows.results.map((row) => ({ ...row, image_url: sanitizeImageUrl(row.image_url) })));
});

app.get('/api/youth/university-notices', async (c) => {
	const { university, category } = c.req.query();
	const where = [];
	const params = [];
	if (university) {
		where.push('university=?');
		params.push(university);
	}
	if (category) {
		const categoryGroup = UNIVERSITY_CATEGORY_ALIASES[category] || [category];
		where.push(`category IN (${categoryGroup.map(() => '?').join(',')})`);
		params.push(...categoryGroup);
	}
	const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';
	const rows = await c.env.DB.prepare(`SELECT * FROM university_notices ${wc} ORDER BY published_at DESC, id DESC LIMIT 100`)
		.bind(...params)
		.all();
	return c.json(rows.results);
});

app.get('/api/college/contests', async (c) => {
	const rows = await c.env.DB.prepare('SELECT * FROM contests ORDER BY CASE WHEN deadline IS NULL THEN 1 ELSE 0 END, deadline ASC').all();
	return c.json(rows.results);
});

app.get('/api/college/scholarships', async (c) => {
	const rows = await c.env.DB.prepare(
		'SELECT * FROM scholarships ORDER BY CASE WHEN deadline IS NULL THEN 1 ELSE 0 END, deadline ASC',
	).all();
	return c.json(rows.results);
});

app.get('/api/college/housing', async (c) => {
	const rows = await c.env.DB.prepare(
		"SELECT * FROM real_estate WHERE deal_type IN ('월세','전세') ORDER BY deal_date DESC, id DESC LIMIT 100",
	).all();
	return c.json(rows.results);
});

app.get('/api/jobs', async (c) => {
	const { experience_level, job_type, page = '1', size = '20' } = c.req.query();
	const pageNum = Math.max(toInt(page, 1), 1);
	const limit = clampPageSize(size);
	const offset = (pageNum - 1) * limit;
	const where = [];
	const params = [];
	if (experience_level) {
		where.push('experience_level=?');
		params.push(experience_level);
	}
	if (job_type) {
		where.push('job_type=?');
		params.push(job_type);
	}
	const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';
	const total = await c.env.DB.prepare(`SELECT COUNT(*) AS cnt FROM jobs ${wc}`)
		.bind(...params)
		.first('cnt');
	const rows = await c.env.DB.prepare(
		`SELECT * FROM jobs ${wc} ORDER BY CASE WHEN deadline IS NULL THEN 1 ELSE 0 END, deadline ASC LIMIT ? OFFSET ?`,
	)
		.bind(...params, limit, offset)
		.all();
	return c.json({ items: rows.results, total: total || 0, page: pageNum, size: limit, has_next: offset + limit < (total || 0) });
});

app.get('/api/certifications', async (c) => {
	const { category } = c.req.query();
	const where = [];
	const params = [];
	if (category) {
		where.push('category = ?');
		params.push(category);
	}
	const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';
	const rows = await c.env.DB.prepare(`SELECT * FROM certifications ${wc} ORDER BY exam_date ASC`)
		.bind(...params)
		.all();
	return c.json(rows.results);
});

app.get('/api/family/real-estate', async (c) => {
	const { property_type, deal_type } = c.req.query();
	const where = [];
	const params = [];
	if (property_type) {
		where.push('property_type=?');
		params.push(property_type);
	}
	if (deal_type) {
		where.push('deal_type=?');
		params.push(deal_type);
	}
	const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';
	const rows = await c.env.DB.prepare(`SELECT * FROM real_estate ${wc} ORDER BY deal_date DESC, id DESC LIMIT 100`)
		.bind(...params)
		.all();
	const num = (s) => {
		if (s == null) return null;
		const n = parseInt(String(s).replace(/[^\d]/g, ''), 10);
		return Number.isFinite(n) ? n : null;
	};
	const normFloor = (f) => {
		const s = f == null ? '' : String(f).trim();
		return !s || s === '0' || s === 'None' ? '-' : s;
	};
	return c.json(
		rows.results.map((r) => ({
			id: r.id,
			address:
				r.address ||
				([r.district, r.dong, r.title].filter(Boolean).join(' ')
					? `천안시 ${[r.district, r.dong, r.title].filter(Boolean).join(' ')}`
					: null),
			property_type: r.property_type,
			deal_type: r.deal_type,
			price: r.deal_type === '매매' ? num(r.price) : num(r.deposit),
			monthly_rent: num(r.monthly_rent),
			area: r.area_sqm != null ? Math.round(r.area_sqm) : null,
			floor: normFloor(r.floor),
			transaction_date: r.deal_date,
		})),
	);
});

app.get('/api/life-info/:section', async (c) => {
	const section = c.req.param('section');
	const [latestNotices, contests, scholarships, affordableHomes, cafeFood, mappedPlaces, placeCount, noticeCount, estateCount] =
		await Promise.all([
			c.env.DB.prepare('SELECT * FROM university_notices ORDER BY published_at DESC, id DESC LIMIT 6').all(),
			c.env.DB.prepare('SELECT * FROM contests ORDER BY CASE WHEN deadline IS NULL THEN 1 ELSE 0 END, deadline ASC LIMIT 4').all(),
			c.env.DB.prepare('SELECT * FROM scholarships ORDER BY CASE WHEN deadline IS NULL THEN 1 ELSE 0 END, deadline ASC LIMIT 4').all(),
			c.env.DB.prepare("SELECT * FROM real_estate WHERE deal_type IN ('월세','전세') ORDER BY deal_date DESC, id DESC LIMIT 6").all(),
			c.env.DB.prepare(
				"SELECT * FROM places WHERE category IN ('카페','분식','한식','음식점','패스트푸드') ORDER BY COALESCE(updated_at, collected_at) DESC, id DESC LIMIT 6",
			).all(),
			c.env.DB.prepare(
				'SELECT * FROM places WHERE latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY COALESCE(updated_at, collected_at) DESC, id DESC LIMIT 6',
			).all(),
			c.env.DB.prepare('SELECT COUNT(*) AS cnt FROM places').first('cnt'),
			c.env.DB.prepare('SELECT COUNT(*) AS cnt FROM university_notices').first('cnt'),
			c.env.DB.prepare('SELECT COUNT(*) AS cnt FROM real_estate').first('cnt'),
		]);
	const commonStats = [
		{ label: '맛집/카페', value: placeCount || 0 },
		{ label: '대학 공지', value: noticeCount || 0 },
		{ label: '주거 거래', value: estateCount || 0 },
	];
	const payloads = {
		accessibility: {
			status: '데이터 연동',
			stats: commonStats,
			sections: [
				{
					title: '좌표 확인 가능한 생활시설',
					caption: '무장애 세부 속성은 추가 API 연동 전까지 위치 기반 후보로 표시합니다.',
					items: mappedPlaces.results.map(placeInfoItem),
				},
				{
					title: '우선 보강할 무장애 속성',
					items: [
						{ title: '휠체어 출입', description: '출입구 단차/경사로/엘리베이터 여부' },
						{ title: '장애인 화장실', description: '층별 위치와 운영 시간' },
						{ title: '저상버스·주차', description: '정류장·주차장 접근 거리' },
					],
				},
			],
		},
		'high-school': {
			status: '데이터 연동',
			stats: commonStats,
			sections: [
				{ title: '최신 학교/대학 공지', items: latestNotices.results.map(noticeItem) },
				{
					title: '청소년 참여 정보',
					items: contests.results.map((row) => ({
						title: row.title,
						subtitle: row.organizer,
						description: row.category,
						meta: row.deadline || '상시',
						url: row.url,
					})),
				},
			],
		},
		medical: {
			status: '공식 링크 연동',
			stats: commonStats,
			sections: [
				{
					title: '긴급/야간 확인 경로',
					caption: '운영 시간은 수시 변동되므로 방문 전 공식 포털 또는 전화 확인이 필요합니다.',
					items: [
						{
							title: '응급상황',
							subtitle: '119',
							description: '즉시 119 또는 응급의료포털 E-Gen에서 응급실을 확인하세요.',
							meta: '24시간',
						},
						{ title: '동남구보건소', subtitle: '공식 보건소', description: '의료기관/약국 현황 및 보건 안내', meta: '공식' },
						{ title: '서북구보건소', subtitle: '공식 보건소', description: '예방접종·보건민원·지역 의료 안내', meta: '공식' },
					],
				},
				{
					title: '대기 중인 의료 데이터',
					items: [{ title: '병원/약국 상세 목록', description: '공공데이터 상세 API 키 확보 후 자동 수집 예정' }],
				},
			],
		},
		'foreign-life': {
			status: '생활 정보 연동',
			stats: commonStats,
			sections: [
				{
					title: '외국인 생활 핵심 안내',
					items: [
						{ title: '다국어 생활상담', subtitle: '다누리', description: '한국 생활, 가족, 체류 상담 다국어 지원', meta: '1577-1366' },
						{
							title: '천안시 행정 민원',
							subtitle: '민원/생활',
							description: '전입, 세금, 쓰레기 배출, 교통카드 등 생활 행정 확인',
							meta: '공식',
						},
						{
							title: '외국인 친화 맛집 후보',
							subtitle: '지도/리뷰 기반',
							description: '카페·한식·분식 위주로 먼저 탐색 가능',
							meta: `${cafeFood.results.length}곳 표시`,
						},
					],
				},
				{ title: '추천 장소', items: cafeFood.results.slice(0, 4).map(placeInfoItem) },
			],
		},
		'single-household': {
			status: '데이터 연동',
			stats: commonStats,
			sections: [
				{ title: '최근 1인 주거 후보', items: affordableHomes.results.map(estateItem) },
				{ title: '혼밥/카페 추천', items: cafeFood.results.map(placeInfoItem) },
				{
					title: '안전/지원 체크리스트',
					items: [
						{ title: '안심 귀가/위급 상황', description: '긴급 상황은 112/119, 생활 안전 정보는 천안시 공지 확인' },
						{ title: '주거 지원', description: '청년·1인가구 주거 정책은 복지로/천안시 공고와 함께 확인' },
					],
				},
			],
		},
	};
	const result = payloads[section] || payloads.accessibility;
	return c.json({ ...result, source_links: OFFICIAL_LINKS[section] || [] });
});

export default app;
