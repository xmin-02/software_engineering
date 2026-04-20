import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());

app.get('/health', (c) => c.json({ status: 'ok' }));

// === Dashboard ===

app.get('/api/posts', async (c) => {
  const { source, sentiment, date_from, date_to, page = '1', size = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(size);
  const limit = parseInt(size);
  let where = [], params = [];
  if (source) { where.push('p.source = ?'); params.push(source); }
  if (sentiment) { where.push('a.sentiment = ?'); params.push(sentiment); }
  if (date_from) { where.push('p.published_at >= ?'); params.push(date_from); }
  if (date_to) { where.push('p.published_at <= ?'); params.push(date_to); }
  const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM posts p LEFT JOIN analysis a ON p.id=a.post_id ${wc}`).bind(...params).first('cnt');
  const rows = await c.env.DB.prepare(`SELECT p.id,p.source,p.title,p.content,p.author,p.url,p.published_at,a.sentiment,a.sentiment_score,a.topic,a.keywords FROM posts p LEFT JOIN analysis a ON p.id=a.post_id ${wc} ORDER BY p.published_at DESC LIMIT ? OFFSET ?`).bind(...params, limit, offset).all();
  return c.json({ items: rows.results.map(r => ({ ...r, keywords: r.keywords ? JSON.parse(r.keywords) : null })), total, page: parseInt(page), size: limit });
});

app.get('/api/stats/sentiment', async (c) => {
  const { source, date_from, date_to } = c.req.query();
  let where = [], params = [];
  if (source) { where.push('p.source = ?'); params.push(source); }
  if (date_from) { where.push('p.published_at >= ?'); params.push(date_from); }
  if (date_to) { where.push('p.published_at <= ?'); params.push(date_to); }
  const join = where.length ? 'JOIN posts p ON a.post_id=p.id' : '';
  const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const row = await c.env.DB.prepare(`SELECT COUNT(CASE WHEN a.sentiment='positive' THEN 1 END) as positive, COUNT(CASE WHEN a.sentiment='negative' THEN 1 END) as negative, COUNT(CASE WHEN a.sentiment='neutral' THEN 1 END) as neutral, COUNT(*) as total FROM analysis a ${join} ${wc}`).bind(...params).first();
  return c.json(row);
});

app.get('/api/stats/trend', async (c) => {
  const { interval = 'daily', source, date_from, date_to } = c.req.query();
  const dateExpr = interval === 'weekly' ? "strftime('%Y-%W', p.published_at)" : "date(p.published_at)";
  let where = ["p.published_at IS NOT NULL"], params = [];
  if (!date_from) { where.push("p.published_at >= date('now', '-30 days')"); }
  else { where.push('p.published_at >= ?'); params.push(date_from); }
  if (date_to) { where.push('p.published_at <= ?'); params.push(date_to); }
  if (source) { where.push('p.source = ?'); params.push(source); }
  const rows = await c.env.DB.prepare(`SELECT ${dateExpr} as date, COUNT(CASE WHEN a.sentiment='positive' THEN 1 END) as positive, COUNT(CASE WHEN a.sentiment='negative' THEN 1 END) as negative, COUNT(CASE WHEN a.sentiment='neutral' THEN 1 END) as neutral FROM analysis a JOIN posts p ON a.post_id=p.id WHERE ${where.join(' AND ')} GROUP BY date ORDER BY date`).bind(...params).all();
  return c.json(rows.results);
});

app.get('/api/stats/sources', async (c) => {
  const rows = await c.env.DB.prepare(`SELECT p.source, COUNT(CASE WHEN a.sentiment='positive' THEN 1 END) as positive, COUNT(CASE WHEN a.sentiment='negative' THEN 1 END) as negative, COUNT(CASE WHEN a.sentiment='neutral' THEN 1 END) as neutral FROM analysis a JOIN posts p ON a.post_id=p.id GROUP BY p.source`).all();
  return c.json(rows.results);
});

app.get('/api/topics', async (c) => {
  const { period = 'today' } = c.req.query();
  let df = '';
  if (period === 'today') df = "AND date(p.published_at)=date('now')";
  else if (period === 'weekly') df = "AND p.published_at>=date('now','-7 days')";
  const rows = await c.env.DB.prepare(`SELECT a.topic as name, COUNT(*) as post_count FROM analysis a JOIN posts p ON a.post_id=p.id WHERE a.topic IS NOT NULL AND a.topic!='기타' AND a.topic NOT LIKE '%견적%' AND a.topic NOT LIKE '%000원%' AND a.topic NOT LIKE '%화환%' AND a.topic NOT LIKE '%시공%' AND a.topic NOT LIKE '%영업시간%' ${df} GROUP BY a.topic ORDER BY COUNT(*) DESC LIMIT 15`).all();
  return c.json(rows.results.map((r, i) => ({ id: i + 1, ...r, keywords: [], sentiment: null, score: null })));
});

app.get('/api/topics/:id/posts', async (c) => {
  const tid = parseInt(c.req.param('id'));
  const topics = await c.env.DB.prepare(`SELECT a.topic as name FROM analysis a JOIN posts p ON a.post_id=p.id WHERE a.topic IS NOT NULL AND a.topic!='기타' GROUP BY a.topic ORDER BY COUNT(*) DESC LIMIT 15`).all();
  const topic = topics.results[tid - 1];
  if (!topic) return c.json([]);
  const rows = await c.env.DB.prepare(`SELECT p.id,p.source,p.title,p.content,p.author,p.url,p.published_at,a.sentiment,a.sentiment_score,a.topic,a.keywords FROM analysis a JOIN posts p ON a.post_id=p.id WHERE a.topic=? ORDER BY p.published_at DESC LIMIT 50`).bind(topic.name).all();
  return c.json(rows.results.map(r => ({ ...r, keywords: r.keywords ? JSON.parse(r.keywords) : null })));
});

app.get('/api/keywords', async (c) => {
  const { limit = '50' } = c.req.query();
  const rows = await c.env.DB.prepare('SELECT keywords FROM analysis WHERE keywords IS NOT NULL LIMIT 2000').all();
  const freq = {};
  const spam = ['견적','000원','전화상담','무료견적','신속처리','안전운송','친절서비스','꽃집','화환','근조','장례','이사','납품','대여','교체','수리','시공','예식장','결혼축하','사다리차','비상주사무실','싱크대','페인트','미용실','피부관리','휴대폰성지','인테리어','에어컨','보일러','정책자금','대출','보험','영업시간'];
  for (const row of rows.results) {
    try {
      const kws = JSON.parse(row.keywords);
      if (Array.isArray(kws)) for (const kw of kws) if (!spam.some(s => kw.includes(s))) freq[kw] = (freq[kw] || 0) + 1;
    } catch {}
  }
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, parseInt(limit));
  return c.json(sorted.map(([keyword, count]) => ({ keyword, count })));
});

app.get('/api/summaries', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM weekly_summaries ORDER BY week_start DESC LIMIT 10').all();
  return c.json(rows.results.map(r => ({ ...r, top_topics: r.top_topics ? JSON.parse(r.top_topics) : null, sentiment_ratio: r.sentiment_ratio ? JSON.parse(r.sentiment_ratio) : null })));
});

// === Places ===

app.get('/api/places', async (c) => {
  const { category, age_group, page = '1', size = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(size);
  const limit = parseInt(size);
  let where = [], params = [];
  if (category) { where.push('p.category = ?'); params.push(category); }
  if (age_group === 'youth') where.push("p.category NOT IN ('술집','주점')");
  if (age_group === 'family') where.push("p.id NOT IN (SELECT place_id FROM place_tags WHERE tag='노키즈존')");
  let tagFilter = '';
  if (age_group === 'college') tagFilter = "AND p.id IN (SELECT place_id FROM place_tags WHERE tag IN ('가성비','카공','데이트','단체석'))";
  if (age_group === 'family') tagFilter += " AND p.id IN (SELECT place_id FROM place_tags WHERE tag IN ('가족','키즈시설'))";
  const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const fullWhere = wc + (tagFilter ? (wc ? ' ' + tagFilter : 'WHERE ' + tagFilter.slice(4)) : '');
  const total = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM places p ${fullWhere}`).bind(...params).first('cnt');
  const rows = await c.env.DB.prepare(`SELECT p.*, (SELECT CAST(SUM(CASE WHEN sentiment='positive' THEN 1 ELSE 0 END) AS REAL)/MAX(COUNT(*),1) FROM place_reviews WHERE place_id=p.id) as avg_sentiment_score, (SELECT COUNT(*) FROM place_reviews WHERE place_id=p.id) as review_count FROM places p ${fullWhere} LIMIT ? OFFSET ?`).bind(...params, limit, offset).all();
  const items = [];
  for (const row of rows.results) {
    const tags = await c.env.DB.prepare('SELECT tag FROM place_tags WHERE place_id=?').bind(row.id).all();
    items.push({ ...row, is_open_now: false, tags: tags.results.map(t => t.tag), business_hours: row.business_hours ? JSON.parse(row.business_hours) : null });
  }
  return c.json({ items, total: total || 0, page: parseInt(page), size: limit, has_next: offset + limit < (total || 0) });
});

app.get('/api/places/ranking', async (c) => {
  const { category, limit = '10' } = c.req.query();
  let where = '', params = [parseInt(limit)];
  if (category) { where = 'WHERE p.category = ?'; params = [category, parseInt(limit)]; }
  const rows = await c.env.DB.prepare(`SELECT p.id,p.name,p.category,p.address,p.rating_naver,p.rating_kakao, CAST(SUM(CASE WHEN r.sentiment='positive' THEN 1 ELSE 0 END) AS REAL)/COUNT(r.id) as avg_sentiment_score, COUNT(r.id) as review_count FROM places p JOIN place_reviews r ON p.id=r.place_id ${where} GROUP BY p.id HAVING COUNT(r.id)>=2 ORDER BY avg_sentiment_score DESC LIMIT ?`).bind(...params).all();
  return c.json(rows.results);
});

app.get('/api/places/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const place = await c.env.DB.prepare('SELECT * FROM places WHERE id=?').bind(id).first();
  if (!place) return c.json({ error: 'Not found' }, 404);
  const reviews = await c.env.DB.prepare('SELECT * FROM place_reviews WHERE place_id=? ORDER BY published_at DESC').bind(id).all();
  const tags = await c.env.DB.prepare('SELECT tag FROM place_tags WHERE place_id=?').bind(id).all();
  const stats = await c.env.DB.prepare("SELECT CAST(SUM(CASE WHEN sentiment='positive' THEN 1 ELSE 0 END) AS REAL)/MAX(COUNT(*),1) as avg_score, COUNT(*) as cnt FROM place_reviews WHERE place_id=?").bind(id).first();
  return c.json({
    place: { ...place, is_open_now: false, tags: tags.results.map(t => t.tag), avg_sentiment_score: stats?.avg_score, review_count: stats?.cnt || 0, business_hours: place.business_hours ? JSON.parse(place.business_hours) : null },
    reviews: reviews.results.map(r => ({ ...r, keywords: r.keywords ? JSON.parse(r.keywords) : null })),
  });
});

// === Content ===

app.get('/api/events', async (c) => {
  const { category } = c.req.query();
  let where = ["(end_date >= date('now') OR end_date IS NULL)"], params = [];
  if (category) { where.push('category = ?'); params.push(category); }
  const rows = await c.env.DB.prepare(`SELECT * FROM events WHERE ${where.join(' AND ')} ORDER BY CASE WHEN start_date IS NULL THEN 1 ELSE 0 END, start_date ASC LIMIT 50`).bind(...params).all();
  return c.json(rows.results);
});

app.get('/api/youth/university-notices', async (c) => {
  const { university, category } = c.req.query();
  let where = [], params = [];
  if (university) { where.push('university=?'); params.push(university); }
  if (category) { where.push('category=?'); params.push(category); }
  const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = await c.env.DB.prepare(`SELECT * FROM university_notices ${wc} ORDER BY published_at DESC LIMIT 100`).bind(...params).all();
  return c.json(rows.results);
});

app.get('/api/college/contests', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM contests ORDER BY deadline ASC').all();
  return c.json(rows.results);
});

app.get('/api/college/scholarships', async (c) => {
  const rows = await c.env.DB.prepare('SELECT * FROM scholarships ORDER BY deadline ASC').all();
  return c.json(rows.results);
});

app.get('/api/college/housing', async (c) => {
  const rows = await c.env.DB.prepare("SELECT * FROM real_estate WHERE deal_type IN ('월세','전세') ORDER BY deal_date DESC LIMIT 100").all();
  return c.json(rows.results);
});

app.get('/api/jobs', async (c) => {
  const { experience_level, job_type, page = '1', size = '20' } = c.req.query();
  const offset = (parseInt(page) - 1) * parseInt(size);
  const limit = parseInt(size);
  let where = [], params = [];
  if (experience_level) { where.push('experience_level=?'); params.push(experience_level); }
  if (job_type) { where.push('job_type=?'); params.push(job_type); }
  const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const total = await c.env.DB.prepare(`SELECT COUNT(*) as cnt FROM jobs ${wc}`).bind(...params).first('cnt');
  const rows = await c.env.DB.prepare(`SELECT * FROM jobs ${wc} ORDER BY deadline ASC LIMIT ? OFFSET ?`).bind(...params, limit, offset).all();
  return c.json({ items: rows.results, total: total || 0, page: parseInt(page), size: limit, has_next: offset + limit < (total || 0) });
});

app.get('/api/certifications', async (c) => {
  const { category } = c.req.query();
  let where = [], params = [];
  if (category) { where.push('category = ?'); params.push(category); }
  const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = await c.env.DB.prepare(`SELECT * FROM certifications ${wc} ORDER BY exam_date ASC`).bind(...params).all();
  return c.json(rows.results);
});

app.get('/api/family/real-estate', async (c) => {
  const { property_type, deal_type } = c.req.query();
  let where = [], params = [];
  if (property_type) { where.push('property_type=?'); params.push(property_type); }
  if (deal_type) { where.push('deal_type=?'); params.push(deal_type); }
  const wc = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const rows = await c.env.DB.prepare(`SELECT * FROM real_estate ${wc} ORDER BY deal_date DESC LIMIT 100`).bind(...params).all();
  const toInt = (s) => {
    if (s == null) return null;
    const n = parseInt(String(s).replace(/[^\d]/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  };
  return c.json(rows.results.map((r) => ({
    id: r.id,
    address: r.address || [r.district, r.dong, r.title].filter(Boolean).join(' ') || null,
    property_type: r.property_type,
    deal_type: r.deal_type,
    price: r.deal_type === '매매' ? toInt(r.price) : toInt(r.deposit),
    monthly_rent: toInt(r.monthly_rent),
    area: r.area_sqm != null ? Math.round(r.area_sqm) : null,
    floor: r.floor,
    transaction_date: r.deal_date,
  })));
});

export default app;
