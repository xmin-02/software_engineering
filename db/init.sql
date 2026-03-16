-- 게시글 원본
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    source VARCHAR(20) NOT NULL,
    source_id VARCHAR(255) UNIQUE,
    title TEXT,
    content TEXT NOT NULL,
    author VARCHAR(100),
    published_at TIMESTAMP,
    collected_at TIMESTAMP DEFAULT NOW()
);

-- 감성 분석 결과
CREATE TABLE IF NOT EXISTS analysis (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    sentiment VARCHAR(10) NOT NULL,
    sentiment_score FLOAT NOT NULL,
    topic VARCHAR(100),
    keywords TEXT[],
    analyzed_at TIMESTAMP DEFAULT NOW()
);

-- 주간 요약
CREATE TABLE IF NOT EXISTS weekly_summaries (
    id SERIAL PRIMARY KEY,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    summary TEXT,
    top_topics TEXT[],
    total_posts INTEGER NOT NULL DEFAULT 0,
    sentiment_ratio JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 장소 (맛집/카페)
CREATE TABLE IF NOT EXISTS places (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    address TEXT,
    rating_naver FLOAT,
    rating_kakao FLOAT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    collected_at TIMESTAMP DEFAULT NOW()
);

-- 장소 리뷰
CREATE TABLE IF NOT EXISTS place_reviews (
    id SERIAL PRIMARY KEY,
    place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL,
    review_text TEXT NOT NULL,
    sentiment VARCHAR(10),
    sentiment_score FLOAT,
    keywords TEXT[],
    published_at TIMESTAMP,
    analyzed_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_source ON posts(source);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_analysis_post_id ON analysis(post_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sentiment ON analysis(sentiment);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_place_reviews_place_id ON place_reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_place_reviews_source ON place_reviews(source);
