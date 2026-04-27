"""D1(SQLite) 덤프 → PostgreSQL(cheonan DB) 이관.

사용:
    venv/bin/python scripts/migrate_d1_to_pg.py \\
        --sqlite-dump .backups/cheonan-db_YYYYMMDD_HHMMSS.sql \\
        --pg-dsn postgresql://cheonan:PW@192.168.45.70:5432/cheonan

- D1 스키마/CREATE TABLE 무시 (PG에 이미 db/init.sql 적용됨 가정)
- D1 컬럼 ⊂ PG 컬럼: 겹치는 것만 INSERT, 나머진 PG 기본값
- JSON TEXT → PG TEXT[] / JSONB 자동 변환
- INTEGER 0/1 → BOOLEAN
- 로드 후 SERIAL 시퀀스 max(id)+1 로 재설정
"""
from __future__ import annotations

import argparse
import json
import sqlite3
import subprocess
import tempfile
from pathlib import Path

import psycopg2
import psycopg2.extras


# D1 → PG 테이블별 컬럼 매핑
# None = D1엔 있지만 PG에 스킵, "col" = 같은 이름으로 복사, ("col", fn) = 변환
def parse_keywords_json(v):
    if v is None or v == "":
        return None
    try:
        arr = json.loads(v)
        return arr if isinstance(arr, list) else None
    except Exception:
        return None


def to_bool(v):
    if v is None:
        return None
    return bool(int(v)) if str(v).isdigit() else None


def jsonb_pass(v):
    # TEXT에 JSON 문자열 그대로 들어있음 → psycopg2 Json으로 감싸 JSONB로
    if v is None or v == "":
        return None
    try:
        return psycopg2.extras.Json(json.loads(v))
    except Exception:
        return None


# 각 튜플: (pg_col, d1_col, converter|None)
TABLES: dict[str, list[tuple[str, str, callable | None]]] = {
    "posts": [
        ("id", "id", None),
        ("source", "source", None),
        ("source_id", "source_id", None),
        ("title", "title", None),
        ("content", "content", None),
        ("author", "author", None),
        ("url", "url", None),
        ("published_at", "published_at", None),
        ("collected_at", "collected_at", None),
    ],
    "analysis": [
        ("id", "id", None),
        ("post_id", "post_id", None),
        ("sentiment", "sentiment", None),
        ("emotion", "emotion", None),
        ("sentiment_score", "sentiment_score", None),
        ("topic", "topic", None),
        ("keywords", "keywords", parse_keywords_json),
        ("analyzed_at", "analyzed_at", None),
    ],
    "places": [
        ("id", "id", None),
        ("name", "name", None),
        ("category", "category", None),
        ("address", "address", None),
        ("rating_naver", "rating_naver", None),
        ("rating_kakao", "rating_kakao", None),
        ("latitude", "latitude", None),
        ("longitude", "longitude", None),
        ("business_hours", "business_hours", jsonb_pass),
        ("has_parking", "has_parking", to_bool),
        ("price_range", "price_range", None),
        ("collected_at", "collected_at", None),
    ],
    "place_reviews": [
        ("id", "id", None),
        ("place_id", "place_id", None),
        ("source", "source", None),
        ("review_text", "review_text", None),
        ("review_url", "review_url", None),
        ("sentiment", "sentiment", None),
        ("sentiment_score", "sentiment_score", None),
        ("keywords", "keywords", parse_keywords_json),
        ("published_at", "published_at", None),
    ],
    "place_tags": [
        ("id", "id", None),
        ("place_id", "place_id", None),
        ("tag", "tag", None),
        ("confidence", "confidence", None),
        ("source_count", "source_count", None),
    ],
    "events": [
        ("id", "id", None),
        ("title", "title", None),
        ("description", "description", None),
        ("location", "location", None),
        ("start_date", "start_date", None),
        ("end_date", "end_date", None),
        ("url", "url", None),
        ("source", "source", None),
        ("category", "category", None),
    ],
    "university_notices": [
        ("id", "id", None),
        ("university", "university", None),
        ("title", "title", None),
        ("category", "category", None),
        ("url", "url", None),
        ("published_at", "published_at", None),
        ("source_id", "source_id", None),
    ],
    "real_estate": [
        ("id", "id", None),
        ("title", "title", None),
        ("address", "address", None),
        ("district", "district", None),
        ("dong", "dong", None),
        ("property_type", "property_type", None),
        ("deal_type", "deal_type", None),
        ("price", "price", None),
        ("deposit", "deposit", None),
        ("monthly_rent", "monthly_rent", None),
        ("area_sqm", "area_sqm", None),
        ("floor", "floor", None),
        ("build_year", "build_year", None),
        ("deal_date", "deal_date", None),
        ("source_id", "source_id", None),
    ],
    "weekly_summaries": [
        ("id", "id", None),
        ("week_start", "week_start", None),
        ("week_end", "week_end", None),
        ("summary", "summary", None),
        ("top_topics", "top_topics", parse_keywords_json),
        ("total_posts", "total_posts", None),
        ("sentiment_ratio", "sentiment_ratio", jsonb_pass),
    ],
}


def build_sqlite_from_dump(dump_path: Path) -> Path:
    tmp = Path(tempfile.mkstemp(suffix=".db")[1])
    tmp.unlink(missing_ok=True)
    subprocess.run(
        ["sqlite3", str(tmp)],
        stdin=dump_path.open("rb"),
        check=True,
    )
    return tmp


def migrate_table(sq: sqlite3.Connection, pg: psycopg2.extensions.connection, table: str,
                  cols: list[tuple[str, str, callable | None]]) -> int:
    d1_cols = [c[1] for c in cols]
    pg_cols = [c[0] for c in cols]
    converters = [c[2] for c in cols]

    cur = sq.execute(f'SELECT {", ".join(d1_cols)} FROM "{table}"')
    rows = cur.fetchall()
    if not rows:
        return 0

    converted = [
        tuple(fn(val) if fn else val for fn, val in zip(converters, row))
        for row in rows
    ]

    placeholders = ", ".join(["%s"] * len(pg_cols))
    col_list = ", ".join(pg_cols)
    sql = f'INSERT INTO "{table}" ({col_list}) VALUES ({placeholders})'

    with pg.cursor() as pcur:
        psycopg2.extras.execute_batch(pcur, sql, converted, page_size=500)
    pg.commit()
    return len(converted)


def reset_sequence(pg, table: str, pk: str = "id") -> None:
    with pg.cursor() as cur:
        cur.execute(
            f"SELECT setval(pg_get_serial_sequence(%s, %s), COALESCE((SELECT MAX({pk}) FROM \"{table}\"), 1), true)",
            (table, pk),
        )
    pg.commit()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sqlite-dump", required=True, type=Path)
    ap.add_argument("--pg-dsn", required=True)
    args = ap.parse_args()

    print(f"[1/4] Reconstructing SQLite from dump: {args.sqlite_dump}")
    sqlite_path = build_sqlite_from_dump(args.sqlite_dump)
    print(f"      -> {sqlite_path}")

    sq = sqlite3.connect(sqlite_path)
    sq.row_factory = None

    print(f"[2/4] Connecting to Postgres")
    pg = psycopg2.connect(args.pg_dsn)

    print(f"[3/4] Migrating {len(TABLES)} tables")
    total = 0
    for table, cols in TABLES.items():
        n = migrate_table(sq, pg, table, cols)
        total += n
        print(f"      {table}: {n:5d} rows")

    print(f"[4/4] Resetting sequences")
    for table in TABLES:
        reset_sequence(pg, table)

    pg.close()
    sq.close()
    sqlite_path.unlink(missing_ok=True)
    print(f"Done. {total} rows migrated.")


if __name__ == "__main__":
    main()
