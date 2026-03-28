import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../api/client';
import './DashboardPage.css';

// 감성 색상 상수
const SENTIMENT_COLORS = {
  positive: '#4CAF50',
  negative: '#F44336',
  neutral: '#9E9E9E',
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

// 날짜 포맷 (YYYY-MM-DD)
function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.slice(0, 10);
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

  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // 필터 상태
  const [filterSource, setFilterSource] = useState('');
  const [filterSentiment, setFilterSentiment] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get('/api/stats/sentiment'),
        api.get('/api/stats/trend', { params: { interval: 'daily' } }),
        api.get('/api/stats/sources'),
        api.get('/api/keywords', { params: { limit: 30 } }),
        api.get('/api/summaries'),
        api.get('/api/posts', { params: { page: 1, size: 50 } }),
        api.get('/api/topics', { params: { period: 'weekly' } }),
        api.get('/api/events'),
      ]);

      const keys = ['sentiment', 'trend', 'sources', 'keywords', 'summaries', 'posts', 'topics', 'events'];
      const setters = [setSentiment, setTrend, setSources, setKeywords, setSummaries, setPosts, setTopics, setEvents];
      const newErrors = {};

      results.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          setters[i](result.value.data);
        } else {
          newErrors[keys[i]] = true;
        }
      });

      setErrors(newErrors);
      setLoading(false);
    };

    fetchData();
  }, []);

  // 감성 분포 데이터 변환
  const pieData = sentiment
    ? Object.entries(sentiment)
        .filter(([key]) => key !== 'total')
        .map(([key, value]) => ({
          name: SENTIMENT_LABELS[key] ?? key,
          value,
          key,
        }))
    : [];

  // 소스별 비교 데이터
  const sourceData = Array.isArray(sources) ? sources : [];

  // 키워드 폰트 크기 계산 (12~26px)
  const keywordMax = keywords?.length
    ? Math.max(...keywords.map((k) => k.count))
    : 1;

  const getKeywordSize = (count) => {
    const min = 12;
    const max = 26;
    return min + ((count / keywordMax) * (max - min));
  };

  // 광고성 키워드 패턴
  const AD_PATTERNS = [
    '견적', '시공', '사다리차', '비상주사무실', '싱크대', '페인트',
    '피부관리', '휴대폰성지', '에어컨', '보일러', '정책자금', '대출',
    '화환', '근조', '장례', '이사짐', '인테리어', '미용실', '환풍기',
    '판매 매입', '납품', '배달 업체', '도시락 무료', '성지 투어',
    '교체/', '수리 ', '설치 ', '업소용', '시간표', '냉장고대여',
  ];
  const isAd = (title) => AD_PATTERNS.some((p) => title?.includes(p));

  // 게시글 필터 적용
  const filteredPosts = posts?.items?.filter((post) => {
    const matchSource = filterSource ? post.source === filterSource : true;
    const matchSentiment = filterSentiment
      ? post.sentiment?.toLowerCase() === filterSentiment
      : true;
    const isCheonan = post.title?.includes('천안') || post.source === 'dcinside' || post.source === 'cheonan_city';
    return matchSource && matchSentiment && isCheonan && !isAd(post.title);
  }) ?? [];

  // 소스 목록 (필터용)
  const sourceList = posts?.items
    ? [...new Set(posts.items.map((p) => p.source))]
    : [];

  if (loading) {
    return (
      <div className="dashboard">
        <p className="loading-text">데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">천안 여론 대시보드</h1>

      {/* Trending Topics + 행사 정보 */}
      <div className="grid-2">
        <div className="card">
          <h2>주간 토픽</h2>
          {errors.topics ? (
            <p className="error-text">데이터를 불러올 수 없습니다</p>
          ) : !topics?.length ? (
            <p className="empty-text">아직 데이터가 없습니다</p>
          ) : (
            <div className="topic-list">
              {topics.slice(0, 8).map((t) => (
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
        </div>

        <div className="card">
          <h2>천안 명소 & 행사</h2>
          {errors.events ? (
            <p className="error-text">데이터를 불러올 수 없습니다</p>
          ) : !events?.length ? (
            <p className="empty-text">등록된 명소가 없습니다</p>
          ) : (
            <div className="event-list">
              {events.slice(0, 6).map((evt) => (
                <div key={evt.id} className="event-item">
                  <div className="event-title">
                    {evt.url ? (
                      <a href={evt.url} target="_blank" rel="noreferrer">{evt.title}</a>
                    ) : evt.title}
                  </div>
                  <div className="event-meta-row">
                    {evt.category && <span className="event-category">{evt.category}</span>}
                    {evt.start_date || evt.end_date ? (
                      <span className="event-date">{formatDate(evt.start_date)} ~ {formatDate(evt.end_date)}</span>
                    ) : null}
                  </div>
                  {evt.location && <div className="event-location">{evt.location}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 상단: 감성 파이차트 + 트렌드 라인차트 */}
      <div className="grid-2">
        {/* 감성 분포 */}
        <div className="card">
          <h2>감성 분포</h2>
          {errors.sentiment ? (
            <p className="error-text">데이터를 불러올 수 없습니다</p>
          ) : pieData.length === 0 ? (
            <p className="empty-text">아직 데이터가 없습니다</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={SENTIMENT_COLORS[entry.key] ?? '#ccc'}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 감성 트렌드 */}
        <div className="card">
          <h2>감성 트렌드 (일별)</h2>
          {errors.trend ? (
            <p className="error-text">데이터를 불러올 수 없습니다</p>
          ) : !trend?.length ? (
            <p className="empty-text">아직 데이터가 없습니다</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend} margin={{ right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="positive"
                  name="긍정"
                  stroke={SENTIMENT_COLORS.positive}
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="negative"
                  name="부정"
                  stroke={SENTIMENT_COLORS.negative}
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="neutral"
                  name="중립"
                  stroke={SENTIMENT_COLORS.neutral}
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 중단: 소스별 바차트 + 키워드 */}
      <div className="grid-2">
        {/* 소스별 비교 */}
        <div className="card">
          <h2>소스별 감성 비교</h2>
          {errors.sources ? (
            <p className="error-text">데이터를 불러올 수 없습니다</p>
          ) : !sourceData.length ? (
            <p className="empty-text">아직 데이터가 없습니다</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sourceData} margin={{ right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="positive"
                  name="긍정"
                  stackId="a"
                  fill={SENTIMENT_COLORS.positive}
                />
                <Bar
                  dataKey="negative"
                  name="부정"
                  stackId="a"
                  fill={SENTIMENT_COLORS.negative}
                />
                <Bar
                  dataKey="neutral"
                  name="중립"
                  stackId="a"
                  fill={SENTIMENT_COLORS.neutral}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 키워드 */}
        <div className="card">
          <h2>주요 키워드 Top 30</h2>
          {errors.keywords ? (
            <p className="error-text">데이터를 불러올 수 없습니다</p>
          ) : !keywords?.length ? (
            <p className="empty-text">아직 데이터가 없습니다</p>
          ) : (
            <div className="keyword-list">
              {keywords.map((kw) => (
                <span
                  key={kw.keyword}
                  className="keyword-tag"
                  style={{ fontSize: `${getKeywordSize(kw.count)}px` }}
                  title={`${kw.count}건`}
                >
                  {kw.keyword}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 하단: 주간 요약 + 게시글 테이블 */}
      <div className="grid-2">
        {/* 주간 AI 요약 */}
        <div className="card">
          <h2>주간 요약</h2>
          {errors.summaries && errors.sentiment ? (
            <p className="error-text">데이터를 불러올 수 없습니다</p>
          ) : summaries?.length ? (
            <div className="summary-list">
              {summaries.slice(0, 2).map((s, idx) => (
                <div key={idx} className="summary-item">
                  <p>{s.summary}</p>
                  <span className="summary-date">{s.created_at?.slice(0, 10)}</span>
                </div>
              ))}
            </div>
          ) : sentiment ? (
            <div className="summary-fallback">
              <p className="summary-text">
                현재까지 총 <strong>{sentiment.total?.toLocaleString()}건</strong>의 게시글이 분석되었습니다.
                긍정 <strong>{sentiment.positive?.toLocaleString()}건</strong>({sentiment.total ? Math.round(sentiment.positive / sentiment.total * 100) : 0}%),
                부정 <strong>{sentiment.negative?.toLocaleString()}건</strong>({sentiment.total ? Math.round(sentiment.negative / sentiment.total * 100) : 0}%),
                중립 <strong>{sentiment.neutral?.toLocaleString()}건</strong>({sentiment.total ? Math.round(sentiment.neutral / sentiment.total * 100) : 0}%)입니다.
              </p>
              {sources?.length > 0 && (
                <p className="summary-text">
                  가장 활발한 소스는 <strong>{sources.reduce((a, b) => (a.positive + a.negative + a.neutral) > (b.positive + b.negative + b.neutral) ? a : b).source}</strong>이며,
                  부정 비율이 가장 높은 소스는 <strong>{sources.reduce((a, b) => (a.negative / Math.max(a.positive + a.negative + a.neutral, 1)) > (b.negative / Math.max(b.positive + b.negative + b.neutral, 1)) ? a : b).source}</strong>입니다.
                </p>
              )}
            </div>
          ) : (
            <p className="empty-text">아직 데이터가 없습니다</p>
          )}
        </div>

        {/* 최근 게시글 테이블 */}
        <div className="card">
          <h2>최근 게시글</h2>
          {/* 필터 */}
          <div className="table-filters">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
            >
              <option value="">전체 소스</option>
              {sourceList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
            >
              <option value="">전체 감성</option>
              <option value="positive">긍정</option>
              <option value="negative">부정</option>
              <option value="neutral">중립</option>
            </select>
          </div>

          {errors.posts ? (
            <p className="error-text">데이터를 불러올 수 없습니다</p>
          ) : !filteredPosts.length ? (
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
                {filteredPosts.slice(0, 10).map((post, idx) => (
                  <tr key={post.id ?? idx}>
                    <td>{post.source}</td>
                    <td className="post-title" title={post.title}>
                      {post.url ? (
                        <a href={post.url} target="_blank" rel="noreferrer">
                          {post.title}
                        </a>
                      ) : (
                        post.title
                      )}
                    </td>
                    <td>
                      <SentimentBadge value={post.sentiment} />
                    </td>
                    <td>{formatDate(post.published_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
