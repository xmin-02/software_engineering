import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());

const RECENT_DAYS = 30;
const TOPIC_DAYS = 7;
const PLACE_FETCH_LIMIT = 1000;

const toInt = (value, fallback = 0) => {
	const n = parseInt(value, 10);
	return Number.isFinite(n) ? n : fallback;
};

const clampPageSize = (value, fallback = 20) => Math.min(Math.max(toInt(value, fallback), 1), 100);

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
	if (['맛집', '맛집/카페', '맛집 · 카페', '맛집·카페', '식당'].includes(normalized)) {
		return ['한식', '중식', '일식', '양식', '분식', '음식점', '패스트푸드', '카페', '카페,디저트', '간식'];
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

const placeResponse = async (db, row) => {
	const tags = await db.prepare('SELECT tag FROM place_tags WHERE place_id=?').bind(row.id).all();
	const business_hours = normalizeBusinessHours(row.business_hours);
	return {
		...row,
		is_open_now: isOpenNow(row.business_hours),
		tags: tags.results.map((t) => t.tag),
		business_hours,
		rating: row.rating_naver ?? row.rating_kakao ?? null,
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

const placeInfoItem = (place) => ({
	id: place.id,
	title: place.name,
	subtitle: place.category,
	description: place.address,
	meta: `평점 ${place.rating_naver || place.rating_kakao || 4.5}`,
	image_url: place.image_url,
});

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
	const { period = 'today' } = c.req.query();
	const latest = await latestPostDate(c.env.DB);
	const params = [];
	let dateFilter = '';
	if (latest && period === 'today') {
		dateFilter = 'AND date(p.published_at)=date(?)';
		params.push(latest);
	} else if (latest && period === 'weekly') {
		dateFilter = `AND date(p.published_at)>=date(?, '-${TOPIC_DAYS} days')`;
		params.push(latest);
	}
	const rows = await c.env.DB.prepare(
		`SELECT a.topic AS name, COUNT(*) AS post_count FROM analysis a JOIN posts p ON a.post_id=p.id WHERE a.topic IS NOT NULL AND a.topic!='기타' AND a.topic NOT LIKE '%견적%' AND a.topic NOT LIKE '%000원%' AND a.topic NOT LIKE '%화환%' AND a.topic NOT LIKE '%시공%' AND a.topic NOT LIKE '%영업시간%' ${dateFilter} GROUP BY a.topic ORDER BY COUNT(*) DESC LIMIT 15`,
	)
		.bind(...params)
		.all();
	return c.json(rows.results.map((r, i) => ({ id: i + 1, ...r, keywords: [], sentiment: null, score: null })));
});

app.get('/api/topics/:id/posts', async (c) => {
	const tid = toInt(c.req.param('id'), 0);
	const latest = await latestPostDate(c.env.DB);
	const params = latest ? [latest] : [];
	const filter = latest ? `AND date(p.published_at)>=date(?, '-${TOPIC_DAYS} days')` : '';
	const topics = await c.env.DB.prepare(
		`SELECT a.topic AS name FROM analysis a JOIN posts p ON a.post_id=p.id WHERE a.topic IS NOT NULL AND a.topic!='기타' ${filter} GROUP BY a.topic ORDER BY COUNT(*) DESC LIMIT 15`,
	)
		.bind(...params)
		.all();
	const topic = topics.results[tid - 1];
	if (!topic) return c.json([]);
	const rows = await c.env.DB.prepare(
		'SELECT p.id,p.source,p.title,p.content,p.author,p.url,p.published_at,a.sentiment,a.sentiment_score,a.topic,a.keywords FROM analysis a JOIN posts p ON a.post_id=p.id WHERE a.topic=? ORDER BY p.published_at DESC, p.id DESC LIMIT 50',
	)
		.bind(topic.name)
		.all();
	return c.json(rows.results.map(parseKeywords));
});

app.get('/api/keywords', async (c) => {
	const { limit = '50' } = c.req.query();
	const rows = await c.env.DB.prepare('SELECT keywords FROM analysis WHERE keywords IS NOT NULL LIMIT 2000').all();
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
	];
	for (const row of rows.results) {
		const kws = parseJson(row.keywords, []);
		if (Array.isArray(kws)) {
			for (const kw of kws) if (kw && !spam.some((s) => kw.includes(s))) freq[kw] = (freq[kw] || 0) + 1;
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
	const { category, age_group, open_now, page = '1', size = '20' } = c.req.query();
	const pageNum = Math.max(toInt(page, 1), 1);
	const limit = clampPageSize(size);
	const offset = (pageNum - 1) * limit;
	const where = [];
	const params = [];
	addCategoryFilter(where, params, 'p.category', category);
	if (age_group === 'youth') where.push("p.category NOT IN ('술집','주점')");
	if (age_group === 'family') where.push("p.id NOT IN (SELECT place_id FROM place_tags WHERE tag='노키즈존')");
	if (age_group === 'college') where.push("p.id IN (SELECT place_id FROM place_tags WHERE tag IN ('가성비','카공','데이트','단체석'))");
	if (age_group === 'family') where.push("p.id IN (SELECT place_id FROM place_tags WHERE tag IN ('가족','키즈시설'))");
	const wc = where.length ? `WHERE ${where.join(' AND ')}` : '';
	const baseSelect = `
		SELECT
			p.*,
			COALESCE(rs.avg_sentiment_score, 0) AS avg_sentiment_score,
			COALESCE(rs.review_count, 0) AS review_count,
			COALESCE(GROUP_CONCAT(DISTINCT pt.tag), '') AS tag_list
		FROM places p
		LEFT JOIN (
			SELECT
				place_id,
				CAST(SUM(CASE WHEN sentiment='positive' THEN 1 ELSE 0 END) AS REAL)/MAX(COUNT(*),1) AS avg_sentiment_score,
				COUNT(*) AS review_count
			FROM place_reviews
			GROUP BY place_id
		) rs ON rs.place_id = p.id
		LEFT JOIN place_tags pt ON pt.place_id = p.id
		${wc}
		GROUP BY p.id
		ORDER BY COALESCE(p.updated_at, p.collected_at) DESC, p.id DESC
	`;
	const toPlace = (row) => ({
		...row,
		tags: row.tag_list ? String(row.tag_list).split(',').filter(Boolean) : [],
		business_hours: normalizeBusinessHours(row.business_hours),
		is_open_now: isOpenNow(row.business_hours),
		rating: row.rating_naver ?? row.rating_kakao ?? null,
		tag_list: undefined,
	});

	if (open_now === 'true') {
		const rows = await c.env.DB.prepare(`${baseSelect} LIMIT ?`).bind(...params, Math.min(PLACE_FETCH_LIMIT, 500)).all();
		const filtered = rows.results.map(toPlace).filter((row) => row.is_open_now);
		const pageItems = filtered.slice(offset, offset + limit);
		return c.json({ items: pageItems, total: filtered.length, page: pageNum, size: limit, has_next: offset + limit < filtered.length });
	}

	const total = await c.env.DB.prepare(`SELECT COUNT(*) AS cnt FROM places p ${wc}`).bind(...params).first('cnt');
	const rows = await c.env.DB.prepare(`${baseSelect} LIMIT ? OFFSET ?`).bind(...params, limit, offset).all();
	return c.json({ items: rows.results.map(toPlace), total: total || 0, page: pageNum, size: limit, has_next: offset + limit < (total || 0) });
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
	const rows = await c.env.DB.prepare(
		`SELECT p.id,p.name,p.category,p.address,p.image_url,p.rating_naver,p.rating_kakao, CAST(SUM(CASE WHEN r.sentiment='positive' THEN 1 ELSE 0 END) AS REAL)/COUNT(r.id) AS avg_sentiment_score, COUNT(r.id) AS review_count FROM places p JOIN place_reviews r ON p.id=r.place_id ${where} GROUP BY p.id HAVING COUNT(r.id)>=2 ORDER BY avg_sentiment_score DESC LIMIT ?`,
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
	const reviews = await c.env.DB.prepare('SELECT * FROM place_reviews WHERE place_id=? ORDER BY published_at DESC LIMIT ?')
		.bind(id, reviewLimit)
		.all();
	const tags = await c.env.DB.prepare('SELECT tag FROM place_tags WHERE place_id=?').bind(id).all();
	const stats = await c.env.DB.prepare(
		"SELECT CAST(SUM(CASE WHEN sentiment='positive' THEN 1 ELSE 0 END) AS REAL)/MAX(COUNT(*),1) AS avg_score, COUNT(*) AS cnt FROM place_reviews WHERE place_id=?",
	)
		.bind(id)
		.first();
	return c.json({
		place: {
			...place,
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
	return c.json(rows.results);
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
		where.push('category=?');
		params.push(category);
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
