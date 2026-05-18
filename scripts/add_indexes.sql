-- 정렬/필터 핫스팟 컬럼에 인덱스 추가. idempotent.
-- 운영 DB에 실행 시 psql 비-트랜잭션 모드(`\i` 또는 `psql -f`)로 돌릴 것.
-- CONCURRENTLY는 트랜잭션 블록 안에서 실행 불가능하므로 -1/--single-transaction 옵션 금지.
--
--   psql "$DB_URL" -f scripts/add_indexes.sql

CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_events_end_date
    ON events (end_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_contests_deadline
    ON contests (deadline);

CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_scholarships_deadline
    ON scholarships (deadline);

CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_real_estate_deal_date
    ON real_estate (deal_date DESC NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_university_notices_published_at
    ON university_notices (published_at DESC NULLS LAST);

CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_place_reviews_place_id
    ON place_reviews (place_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS ix_place_tags_place_id
    ON place_tags (place_id);
