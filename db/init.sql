-- =====================
-- 여론 분석 (메인 대시보드)
-- =====================

-- 게시글 원본
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    source VARCHAR(20) NOT NULL,
    source_id VARCHAR(255) UNIQUE,
    title TEXT,
    content TEXT NOT NULL,
    author VARCHAR(100),
    url TEXT,
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

-- =====================
-- 맛집/카페 (전 연령 공통)
-- =====================

-- 장소
CREATE TABLE IF NOT EXISTS places (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    sub_category VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    rating_naver FLOAT,
    rating_kakao FLOAT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    business_hours JSONB,
    last_order_time TIME,
    has_parking BOOLEAN,
    has_kids_facility BOOLEAN,
    is_no_kids_zone BOOLEAN,
    is_alcohol_only BOOLEAN DEFAULT FALSE,
    price_range VARCHAR(20),
    naver_place_id VARCHAR(100),
    kakao_place_id VARCHAR(100),
    collected_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 장소 리뷰 (블로그 기반)
CREATE TABLE IF NOT EXISTS place_reviews (
    id SERIAL PRIMARY KEY,
    place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
    source VARCHAR(20) NOT NULL,
    review_text TEXT NOT NULL,
    review_url TEXT,
    sentiment VARCHAR(10),
    sentiment_score FLOAT,
    keywords TEXT[],
    published_at TIMESTAMP,
    analyzed_at TIMESTAMP DEFAULT NOW()
);

-- 장소 태그 (NLP 추출 결과)
CREATE TABLE IF NOT EXISTS place_tags (
    id SERIAL PRIMARY KEY,
    place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,
    confidence FLOAT DEFAULT 0.0,
    source_count INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(place_id, tag)
);

-- =====================
-- 행사 정보 (전 연령 공통)
-- =====================

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    location TEXT,
    start_date DATE,
    end_date DATE,
    url TEXT,
    source VARCHAR(50),
    category VARCHAR(50),
    collected_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- 연령별 콘텐츠
-- =====================

-- 공모전
CREATE TABLE IF NOT EXISTS contests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    organizer VARCHAR(200),
    deadline DATE,
    url TEXT,
    category VARCHAR(50),
    source VARCHAR(50),
    collected_at TIMESTAMP DEFAULT NOW()
);

-- 장학금
CREATE TABLE IF NOT EXISTS scholarships (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    organization VARCHAR(200),
    amount VARCHAR(100),
    deadline DATE,
    eligibility TEXT,
    url TEXT,
    source VARCHAR(50),
    collected_at TIMESTAMP DEFAULT NOW()
);

-- 채용 정보
CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    company VARCHAR(200),
    location VARCHAR(100),
    salary VARCHAR(100),
    job_type VARCHAR(50),
    experience_level VARCHAR(50),
    deadline DATE,
    url TEXT,
    source VARCHAR(50),
    source_id VARCHAR(255) UNIQUE,
    collected_at TIMESTAMP DEFAULT NOW()
);

-- 부동산 정보
CREATE TABLE IF NOT EXISTS real_estate (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300),
    address TEXT,
    property_type VARCHAR(50),
    deal_type VARCHAR(50),
    price VARCHAR(100),
    area_sqm FLOAT,
    floor VARCHAR(20),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    url TEXT,
    source VARCHAR(50),
    collected_at TIMESTAMP DEFAULT NOW()
);

-- 자격증 정보
CREATE TABLE IF NOT EXISTS certifications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    exam_date DATE,
    registration_start DATE,
    registration_end DATE,
    fee VARCHAR(100),
    url TEXT,
    source VARCHAR(50),
    collected_at TIMESTAMP DEFAULT NOW()
);

-- 대학 공지사항
CREATE TABLE IF NOT EXISTS university_notices (
    id SERIAL PRIMARY KEY,
    university VARCHAR(100) NOT NULL,
    title VARCHAR(300) NOT NULL,
    category VARCHAR(50),
    url TEXT,
    published_at TIMESTAMP,
    source_id VARCHAR(255) UNIQUE,
    collected_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- 인덱스
-- =====================

CREATE INDEX IF NOT EXISTS idx_posts_source ON posts(source);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at);
CREATE INDEX IF NOT EXISTS idx_analysis_post_id ON analysis(post_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sentiment ON analysis(sentiment);
CREATE INDEX IF NOT EXISTS idx_places_category ON places(category);
CREATE INDEX IF NOT EXISTS idx_places_has_parking ON places(has_parking);
CREATE INDEX IF NOT EXISTS idx_places_is_alcohol_only ON places(is_alcohol_only);
CREATE INDEX IF NOT EXISTS idx_place_reviews_place_id ON place_reviews(place_id);
CREATE INDEX IF NOT EXISTS idx_place_tags_place_id ON place_tags(place_id);
CREATE INDEX IF NOT EXISTS idx_place_tags_tag ON place_tags(tag);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline);
CREATE INDEX IF NOT EXISTS idx_real_estate_property_type ON real_estate(property_type);
CREATE INDEX IF NOT EXISTS idx_certifications_exam_date ON certifications(exam_date);
CREATE INDEX IF NOT EXISTS idx_university_notices_university ON university_notices(university);
