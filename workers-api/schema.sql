CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  source_id TEXT UNIQUE,
  title TEXT,
  content TEXT NOT NULL,
  author TEXT,
  url TEXT,
  published_at TEXT,
  collected_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL REFERENCES posts(id),
  sentiment TEXT NOT NULL,
  emotion TEXT,
  sentiment_score REAL NOT NULL,
  topic TEXT,
  keywords TEXT,
  analyzed_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS places (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  rating_naver REAL,
  rating_kakao REAL,
  latitude REAL,
  longitude REAL,
  business_hours TEXT,
  has_parking INTEGER,
  price_range TEXT,
  collected_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS place_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id INTEGER NOT NULL REFERENCES places(id),
  source TEXT NOT NULL,
  review_text TEXT NOT NULL,
  review_url TEXT,
  sentiment TEXT,
  sentiment_score REAL,
  keywords TEXT,
  published_at TEXT
);

CREATE TABLE IF NOT EXISTS place_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  place_id INTEGER NOT NULL REFERENCES places(id),
  tag TEXT NOT NULL,
  confidence REAL DEFAULT 0.0,
  source_count INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date TEXT,
  end_date TEXT,
  url TEXT,
  source TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS university_notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  university TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  url TEXT,
  published_at TEXT,
  source_id TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  company TEXT,
  location TEXT,
  salary TEXT,
  job_type TEXT,
  experience_level TEXT,
  deadline TEXT,
  url TEXT,
  source TEXT,
  source_id TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS real_estate (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  address TEXT,
  district TEXT,
  dong TEXT,
  property_type TEXT,
  deal_type TEXT,
  price TEXT,
  deposit TEXT,
  monthly_rent TEXT,
  area_sqm REAL,
  floor TEXT,
  build_year TEXT,
  deal_date TEXT,
  source_id TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS weekly_summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL,
  week_end TEXT NOT NULL,
  summary TEXT,
  top_topics TEXT,
  total_posts INTEGER DEFAULT 0,
  sentiment_ratio TEXT
);

CREATE TABLE IF NOT EXISTS contests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  organizer TEXT,
  deadline TEXT,
  url TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS scholarships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  organization TEXT,
  amount TEXT,
  deadline TEXT,
  eligibility TEXT,
  url TEXT
);

CREATE TABLE IF NOT EXISTS certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT,
  exam_date TEXT,
  registration_start TEXT,
  registration_end TEXT,
  fee TEXT,
  url TEXT
);

CREATE INDEX idx_posts_source ON posts(source);
CREATE INDEX idx_posts_published ON posts(published_at);
CREATE INDEX idx_analysis_sentiment ON analysis(sentiment);
CREATE INDEX idx_analysis_topic ON analysis(topic);
CREATE INDEX idx_analysis_post ON analysis(post_id);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_place_tags_place ON place_tags(place_id);
CREATE INDEX idx_place_tags_tag ON place_tags(tag);
CREATE INDEX idx_events_category ON events(category);
