import { useState, useEffect, useCallback } from 'react';
import {
  PieChart, Pie, Cell,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  FileText, SmilePlus, UtensilsCrossed, MapPin, X, ChevronRight,
} from 'lucide-react';
import api from '../api/client';
import './DashboardPage.css';

// 감성 색상 상수
const SENTIMENT_COLORS = {
  positive: '#5a9e6f',
  negative: '#c75a5a',
  neutral: '#a0a4ab',
};


const FIGMA_DASHBOARD_FALLBACK = {
  sentiment: { positive: 0, negative: 0, neutral: 0, total: 0 },
  trend: [],
  keywords: [],
  topics: [],
  events: [],
  posts: { items: [], total: 0 },
};

const SENTIMENT_LABELS = {
  positive: '긍정',
  negative: '부정',
  neutral: '중립',
};

// 감성 뱃지 컴포넌트
function SentimentBadge({ value }) {
  const key = value?.toLowerCase();
  return (
    <span className={`sentiment-badge ${key}`}>
      {SENTIMENT_LABELS[key] ?? value}
    </span>
  );
}

// 날짜 포맷
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = dateStr.slice(5, 10);
  return d.replace('-', '.');
}

function getPlaceItems(places) {
  if (Array.isArray(places)) return places;
  return places?.items ?? [];
}

function getApiItems(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.items ?? [];
}

function normalizeEvent(event) {
  const date = event.displayMeta || event.start_date || event.end_date || event.location || '';
  return {
    ...event,
    displayMeta: date,
  };
}

// 모달 컴포넌트
function DashboardModal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="dash-modal-overlay" onClick={onClose}>
      <div
        className="dash-modal-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="dash-modal-header">
          <h2 className="dash-modal-title">{title}</h2>
          <button className="dash-modal-close" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>
        <div className="dash-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [sentiment, setSentiment] = useState(null);
  const [trend, setTrend] = useState(null);
  const [sources, setSources] = useState(null);
  const [keywords, setKeywords] = useState(null);
  const [summaries, setSummaries] = useState(null);
  const [posts, setPosts] = useState(null);
  const [topics, setTopics] = useState(null);
  const [events, setEvents] = useState(null);
  const [places, setPlaces] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // 필터 상태
  const [filterSource, setFilterSource] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('');

  // 모달 상태
  const [activeModal, setActiveModal] = useState(null);
  const closeModal = useCallback(() => setActiveModal(null), []);

  // 클릭 가능한 div 카드의 키보드 접근 속성 묶음
  const openModalProps = useCallback((modal) => ({
    onClick: () => setActiveModal(modal),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setActiveModal(modal);
      }
    },
    role: 'button',
    tabIndex: 0,
  }), []);

  // 우측 탭 상태
  const rightTab = 'events';

  useEffect(() => {
    let ignore = false;

    const fetchData = () => {
      setLoading(true);
      setErrors({});

      const requests = [
        { key: 'sentiment', setter: setSentiment, request: api.get('/api/stats/sentiment') },
        { key: 'trend', setter: setTrend, request: api.get('/api/stats/trend', { params: { interval: 'daily' } }) },
        { key: 'sources', setter: setSources, request: api.get('/api/stats/sources') },
        { key: 'keywords', setter: setKeywords, request: api.get('/api/keywords', { params: { limit: 30 } }) },
        { key: 'summaries', setter: setSummaries, request: api.get('/api/summaries') },
        { key: 'posts', setter: setPosts, request: api.get('/api/posts', { params: { page: 1, size: 50 } }) },
        { key: 'topics', setter: setTopics, request: api.get('/api/topics', { params: { period: 'weekly' } }) },
        { key: 'events', setter: setEvents, request: api.get('/api/events') },
        { key: 'places', setter: setPlaces, request: api.get('/api/places', { params: { page: 1, size: 6 } }) },
      ];

      const criticalRequests = new Set(['sentiment', 'sources', 'posts', 'events', 'places']);
      let remainingCritical = criticalRequests.size;

      requests.forEach(({ key, setter, request }) => {
        request
          .then((res) => {
            if (!ignore) setter(res.data);
          })
          .catch(() => {
            if (!ignore) setErrors((current) => ({ ...current, [key]: true }));
          })
          .finally(() => {
            if (ignore || !criticalRequests.has(key)) return;
            remainingCritical -= 1;
            if (remainingCritical === 0) setLoading(false);
          });
      });

      window.setTimeout(() => {
        if (!ignore) setLoading(false);
      }, 1200);
    };

    fetchData();
    return () => { ignore = true; };
  }, []);

  // 감성 분포 데이터
  const apiKeywords = getApiItems(keywords);
  const apiTopics = getApiItems(topics);
  const apiEvents = getApiItems(events).map(normalizeEvent);
  const apiPosts = posts?.items ? posts : { items: getApiItems(posts), total: getApiItems(posts).length };
  const apiPlaces = getPlaceItems(places);
  const dashboardSentiment = sentiment?.total ? sentiment : FIGMA_DASHBOARD_FALLBACK.sentiment;
  const dashboardTrend = Array.isArray(trend) && trend.length ? trend : FIGMA_DASHBOARD_FALLBACK.trend;
  const dashboardKeywords = apiKeywords.length ? apiKeywords : FIGMA_DASHBOARD_FALLBACK.keywords;
  const dashboardTopics = apiTopics.length ? apiTopics : FIGMA_DASHBOARD_FALLBACK.topics;
  const dashboardEvents = apiEvents.length ? apiEvents : FIGMA_DASHBOARD_FALLBACK.events;
  const dashboardPosts = apiPosts.items?.length ? apiPosts : FIGMA_DASHBOARD_FALLBACK.posts;

  const pieData = dashboardSentiment
    ? Object.entries(dashboardSentiment)
        .filter(([key]) => key !== 'total')
        .map(([key, value]) => ({
          name: SENTIMENT_LABELS[key] ?? key,
          value,
          key,
        }))
    : [];

  const sourceData = Array.isArray(sources) ? sources : [];

  // 키워드 크기 계산
  const keywordMax = dashboardKeywords?.length
    ? Math.max(...dashboardKeywords.map((k) => k.count))
    : 1;

  const getKeywordSize = (count, max = 36, min = 12) =>
    min + ((count / keywordMax) * (max - min));

  const KEYWORD_COLORS = [
    '#4a5078', '#3d5a8a', '#5e5085', '#2b6e8a',
    '#4e5590', '#3a5e9a', '#6a5095', '#2980a0',
    '#3e4570', '#2e4a6a', '#554080', '#1e6070',
    '#4a5e8a', '#445580', '#6050a0', '#2a6590',
  ];

  const getKeywordColor = (index) => KEYWORD_COLORS[index % KEYWORD_COLORS.length];

  // 광고 필터
  const AD_PATTERNS = [
    '견적', '시공', '사다리차', '비상주사무실', '싱크대', '페인트',
    '피부관리', '휴대폰성지', '에어컨', '보일러', '정책자금', '대출',
    '화환', '근조', '장례', '이사짐', '인테리어', '미용실', '환풍기',
    '판매 매입', '납품', '배달 업체', '도시락 무료', '성지 투어',
    '교체/', '수리 ', '설치 ', '업소용', '시간표', '냉장고대여',
  ];
  const isAd = (title) => AD_PATTERNS.some((p) => title?.includes(p));

  const filteredPosts = dashboardPosts?.items?.filter((post) => {
    const matchSource = filterSource ? post.source === filterSource : true;
    const matchSentiment = filterSentiment
      ? post.sentiment?.toLowerCase() === filterSentiment
      : true;
    const isCheonan = post.title?.includes('천안') || post.source === 'dcinside' || post.source === 'cheonan_city';
    return matchSource && matchSentiment && isCheonan && !isAd(post.title);
  }) ?? [];

  const sourceList = dashboardPosts?.items
    ? [...new Set(dashboardPosts.items.map((p) => p.source))]
    : [];

  // KPI 수치
  const totalPosts = dashboardSentiment?.total ?? 0;
  const positiveRate = dashboardSentiment?.total
    ? Math.round((dashboardSentiment.positive / dashboardSentiment.total) * 100)
    : 0;
  const placeCount = places?.total ?? apiPlaces.length;
  const eventCount = events?.total ?? apiEvents.length;

  if (loading) {
    return (
      <div className="dashboard">
        <p className="loading-text">데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">천안 대시보드</h1>

      <div className="kpi-grid">
        {[
          { icon: FileText, label: 'Total Posts', value: `${totalPosts.toLocaleString()}건`, trend: 'API', modal: 'posts' },
          { icon: SmilePlus, label: 'Positive Rate', value: `${positiveRate}%`, trend: '실시간', modal: 'sentiment' },
          { icon: UtensilsCrossed, label: 'Restaurants', value: `${placeCount.toLocaleString()}곳`, trend: 'DB', modal: 'places' },
          { icon: MapPin, label: 'Events', value: `${eventCount.toLocaleString()}곳`, trend: 'DB', modal: 'events' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="kpi-card"
            onClick={() => setActiveModal(kpi.modal)}
          >
            <div className="kpi-icon-wrap">
              <kpi.icon size={20} />
            </div>
            <div className="kpi-value">{kpi.value}</div>
            <div className="kpi-label">{kpi.label}</div>
            <span className="kpi-trend">{kpi.trend}</span>
          </div>
        ))}
      </div>

      <div className="charts-grid">
        <div className="dash-card">
          <div className="dash-card-title">
            감성 트렌드 (일별)
          </div>
          {!dashboardTrend?.length ? (
            <p className="empty-text">아직 데이터가 없습니다</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dashboardTrend} margin={{ right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="positive" name="긍정" stroke={SENTIMENT_COLORS.positive} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="negative" name="부정" stroke={SENTIMENT_COLORS.negative} dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="neutral" name="중립" stroke={SENTIMENT_COLORS.neutral} dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="dash-card" {...openModalProps('sentiment')} aria-label="감성 분포 자세히 보기">
          <div className="dash-card-title">
            감성 분포
            <span className="dash-card-more">더보기 <ChevronRight size={14} /></span>
          </div>
          {errors.sentiment ? (
            <p className="error-text">데이터를 불러올 수 없습니다</p>
          ) : pieData.length === 0 ? (
            <p className="empty-text">아직 데이터가 없습니다</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={SENTIMENT_COLORS[entry.key] ?? '#ccc'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="content-grid">
        <div className="dash-card" {...openModalProps('topics')} aria-label="주간 토픽 자세히 보기">
          <div className="dash-card-title">
            주간 토픽
            <span className="dash-card-more">더보기 <ChevronRight size={14} /></span>
          </div>
          {!dashboardTopics?.length ? (
            <p className="empty-text">아직 데이터가 없습니다</p>
          ) : (
            <div className="compact-topic-list">
              {dashboardTopics.slice(0, 5).map((t, i) => (
                <div key={t.id} className="compact-topic-item">
                  <span className="compact-topic-rank">{i + 1}</span>
                  <div className="compact-topic-info">
                    <span className="compact-topic-name">{t.name}</span>
                    <span className="compact-topic-count">{t.post_count}건</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dash-card" {...openModalProps('keywords')} aria-label="키워드 자세히 보기">
          <div className="dash-card-title">
            키워드
            <span className="dash-card-more">더보기 <ChevronRight size={14} /></span>
          </div>
          {errors.keywords ? (
            <p className="error-text">데이터를 불러올 수 없습니다</p>
          ) : !dashboardKeywords?.length ? (
            <p className="empty-text">아직 데이터가 없습니다</p>
          ) : (
            <div className="keyword-list compact">
              {dashboardKeywords.slice(0, 10).map((kw, idx) => (
                <span
                  key={kw.keyword}
                  className="keyword-tag"
                  style={{
                    fontSize: `${getKeywordSize(kw.count, 28, 13)}px`,
                    color: getKeywordColor(idx),
                  }}
                  title={`${kw.keyword}: ${kw.count}건`}
                >
                  {kw.keyword}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="dash-card dash-card-tabbed">
          <div className="dash-tab-bar">
            <button className="dash-tab-btn active" type="button" onClick={() => setActiveModal('events')}>명소 & 행사</button>
          </div>

          {rightTab === 'events' ? (
            <div {...openModalProps('events')} aria-label="명소 행사 자세히 보기">
              <div className="dash-card-title" style={{ marginTop: 12 }}>
                <span />
                <span className="dash-card-more">더보기 <ChevronRight size={14} /></span>
              </div>
              {errors.events ? (
                <p className="error-text">데이터를 불러올 수 없습니다</p>
              ) : !dashboardEvents?.length ? (
                <p className="empty-text">등록된 명소가 없습니다</p>
              ) : (
                <div className="compact-event-list">
                  {dashboardEvents.slice(0, 3).map((evt) => (
                    <div key={evt.id} className="compact-event-item">
                      <div className="compact-event-title">
                        {evt.url ? (
                          <a href={evt.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{evt.title}</a>
                        ) : evt.title}
                      </div>
                      <div className="compact-event-meta">
                        {evt.category && <span className="event-category">{evt.category}</span>}
                        {evt.displayMeta && <span className="event-date">{evt.displayMeta}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div {...openModalProps('posts')} aria-label="최근 게시글 자세히 보기">
              <div className="dash-card-title" style={{ marginTop: 12 }}>
                <span />
                <span className="dash-card-more">더보기 <ChevronRight size={14} /></span>
              </div>
              {errors.posts ? (
                <p className="error-text">데이터를 불러올 수 없습니다</p>
              ) : !filteredPosts.length ? (
                <p className="empty-text">아직 데이터가 없습니다</p>
              ) : (
                <div className="compact-post-list">
                  {filteredPosts.slice(0, 5).map((post, idx) => (
                    <div key={post.id ?? idx} className="compact-post-item">
                      <SentimentBadge value={post.sentiment} />
                      <span className="compact-post-title" title={post.title}>
                        {post.url ? (
                          <a href={post.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>{post.title}</a>
                        ) : post.title}
                      </span>
                      <span className="compact-post-date">{formatDate(post.published_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === 모달들 === */}

      {/* 주간 토픽 모달 */}
      <DashboardModal open={activeModal === 'topics'} onClose={closeModal} title="주간 토픽">
        {!dashboardTopics?.length ? (
          <p className="empty-text">아직 데이터가 없습니다</p>
        ) : (
          <div className="topic-list">
            {dashboardTopics.slice(0, 8).map((t) => (
              <div key={t.id} className="topic-card">
                <div className="topic-name">{t.name}</div>
                <div className="topic-meta">
                  <span className="topic-count">{t.post_count}건</span>
                  <div className="topic-keywords">
                    {t.keywords?.slice(0, 3).map((kw, i) => (
                      <span key={i} className="topic-kw">{kw}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardModal>

      {/* 키워드 모달 */}
      <DashboardModal open={activeModal === 'keywords'} onClose={closeModal} title="주요 키워드 Top 30">
        {!dashboardKeywords?.length ? (
          <p className="empty-text">아직 데이터가 없습니다</p>
        ) : (
          <div className="keyword-list">
            {dashboardKeywords.map((kw, idx) => (
              <span
                key={kw.keyword}
                className="keyword-tag"
                style={{
                  fontSize: `${getKeywordSize(kw.count)}px`,
                  color: getKeywordColor(idx),
                }}
                title={`${kw.keyword}: ${kw.count}건`}
              >
                {kw.keyword}
              </span>
            ))}
          </div>
        )}
      </DashboardModal>

      {/* 감성 분포 모달 (+ 소스별 비교) */}
      <DashboardModal open={activeModal === 'sentiment'} onClose={closeModal} title="감성 분포 상세">
        <div className="modal-section">
          <h3>감성 분포</h3>
          {pieData.length === 0 ? (
            <p className="empty-text">아직 데이터가 없습니다</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={SENTIMENT_COLORS[entry.key] ?? '#ccc'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="modal-section">
          <h3>소스별 감성 비교</h3>
          {!sourceData.length ? (
            <p className="empty-text">아직 데이터가 없습니다</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sourceData} margin={{ right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="positive" name="긍정" stackId="a" fill={SENTIMENT_COLORS.positive} />
                <Bar dataKey="negative" name="부정" stackId="a" fill={SENTIMENT_COLORS.negative} />
                <Bar dataKey="neutral" name="중립" stackId="a" fill={SENTIMENT_COLORS.neutral} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 주간 요약 */}
        {summaries?.length ? (
          <div className="modal-section">
            <h3>주간 요약</h3>
            <div className="summary-list">
              {summaries.slice(0, 2).map((s, idx) => (
                <div key={idx} className="summary-item">
                  <p>{s.summary}</p>
                  <span className="summary-date">{s.created_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : sentiment ? (
          <div className="modal-section">
            <h3>주간 요약</h3>
            <div className="summary-fallback">
              <p className="summary-text">
                현재까지 총 <strong>{dashboardSentiment.total?.toLocaleString()}건</strong>의 게시글이 분석되었습니다.
                긍정 <strong>{dashboardSentiment.positive?.toLocaleString()}건</strong>({dashboardSentiment.total ? Math.round(dashboardSentiment.positive / dashboardSentiment.total * 100) : 0}%),
                부정 <strong>{dashboardSentiment.negative?.toLocaleString()}건</strong>({dashboardSentiment.total ? Math.round(dashboardSentiment.negative / dashboardSentiment.total * 100) : 0}%),
                중립 <strong>{dashboardSentiment.neutral?.toLocaleString()}건</strong>({dashboardSentiment.total ? Math.round(dashboardSentiment.neutral / dashboardSentiment.total * 100) : 0}%)입니다.
              </p>
              {sources?.length > 0 && (
                <p className="summary-text">
                  가장 활발한 소스는 <strong>{sources.reduce((a, b) => (a.positive + a.negative + a.neutral) > (b.positive + b.negative + b.neutral) ? a : b).source}</strong>이며,
                  부정 비율이 가장 높은 소스는 <strong>{sources.reduce((a, b) => (a.negative / Math.max(a.positive + a.negative + a.neutral, 1)) > (b.negative / Math.max(b.positive + b.negative + b.neutral, 1)) ? a : b).source}</strong>입니다.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </DashboardModal>

      {/* 맛집 모달 */}
      <DashboardModal open={activeModal === 'places'} onClose={closeModal} title="천안 맛집">
        {errors.places ? (
          <p className="empty-text">맛집 데이터를 불러올 수 없습니다</p>
        ) : getPlaceItems(places).length === 0 ? (
          <p className="empty-text">등록된 맛집이 없습니다</p>
        ) : (
          <div className="place-list">
            {getPlaceItems(places).map((place) => (
              <div key={place.id} className="place-item">
                <div className="place-title">{place.name}</div>
                <div className="place-meta-row">
                  {place.category && <span className="place-category">{place.category}</span>}
                  {place.review_count != null && (
                    <span className="place-review-count">리뷰 {place.review_count}건</span>
                  )}
                </div>
                {place.address && <div className="place-address">{place.address}</div>}
              </div>
            ))}
          </div>
        )}
      </DashboardModal>

      {/* 명소 & 행사 모달 */}
      <DashboardModal open={activeModal === 'events'} onClose={closeModal} title="천안 명소 & 행사">
        {!dashboardEvents?.length ? (
          <p className="empty-text">등록된 명소가 없습니다</p>
        ) : (
          <div className="event-list">
            {dashboardEvents.map((evt) => (
              <div key={evt.id} className="event-item">
                <div className="event-title">
                  {evt.url ? (
                    <a href={evt.url} target="_blank" rel="noreferrer">{evt.title}</a>
                  ) : evt.title}
                </div>
                <div className="event-meta-row">
                  {evt.category && <span className="event-category">{evt.category}</span>}
                  {(evt.start_date || evt.end_date) && (
                    <span className="event-date">{formatDate(evt.start_date)} ~ {formatDate(evt.end_date)}</span>
                  )}
                </div>
                {evt.location && <div className="event-location">{evt.location}</div>}
              </div>
            ))}
          </div>
        )}
      </DashboardModal>

      {/* 최근 게시글 모달 */}
      <DashboardModal open={activeModal === 'posts'} onClose={closeModal} title="최근 게시글">
        <div className="table-filters">
          <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
            <option value="">전체 소스</option>
            {sourceList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select value={filterSentiment} onChange={(e) => setFilterSentiment(e.target.value)}>
            <option value="">전체 감성</option>
            <option value="positive">긍정</option>
            <option value="negative">부정</option>
            <option value="neutral">중립</option>
          </select>
        </div>
        {!filteredPosts.length ? (
          <p className="empty-text">아직 데이터가 없습니다</p>
        ) : (
          <table className="posts-table">
            <thead>
              <tr>
                <th>소스</th>
                <th>제목</th>
                <th>감성</th>
                <th>날짜</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.slice(0, 20).map((post, idx) => (
                <tr key={post.id ?? idx}>
                  <td>{post.source}</td>
                  <td className="post-title" title={post.title}>
                    {post.url ? (
                      <a href={post.url} target="_blank" rel="noreferrer">{post.title}</a>
                    ) : post.title}
                  </td>
                  <td><SentimentBadge value={post.sentiment} /></td>
                  <td>{formatDate(post.published_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DashboardModal>
    </div>
  );
}
