"""DB 대시보드 - 프로젝트 현황 출력"""
from sqlalchemy import text
from backend.database import engine
import backend.models  # noqa


def show():
    with engine.connect() as conn:
        print("=" * 50)
        print("  천안 감성분석 프로젝트 DB 현황")
        print("=" * 50)
        tables = [
            ("posts", "여론 게시글"),
            ("analysis", "AI 분석 결과"),
            ("places", "맛집/카페"),
            ("place_reviews", "장소 리뷰"),
            ("events", "행사/축제"),
            ("university_notices", "대학 공지"),
            ("real_estate", "부동산 실거래"),
            ("jobs", "채용 정보"),
            ("scholarships", "장학금"),
            ("certifications", "자격시험"),
        ]
        for tbl, label in tables:
            cnt = conn.execute(text(f"SELECT COUNT(*) FROM {tbl}")).scalar()
            bar = "█" * min(cnt // 100, 30) if cnt > 0 else "░"
            print(f"  {label:12s} | {cnt:>6,}건 | {bar}")
        print()

        rows = conn.execute(text(
            "SELECT sentiment, COUNT(*) FROM analysis GROUP BY sentiment ORDER BY COUNT(*) DESC"
        )).fetchall()
        print("  [감성 분포]")
        for s, c in rows:
            print(f"    {s:10s}: {c:>5,}건")
        print()

        rows = conn.execute(text(
            "SELECT topic, COUNT(*) FROM analysis WHERE topic IS NOT NULL "
            "GROUP BY topic ORDER BY COUNT(*) DESC LIMIT 5"
        )).fetchall()
        print("  [토픽 Top 5]")
        for t, c in rows:
            print(f"    [{c:>4}건] {t[:30]}")
        print()

        rows = conn.execute(text(
            "SELECT deal_type, COUNT(*) FROM real_estate GROUP BY deal_type ORDER BY COUNT(*) DESC"
        )).fetchall()
        print("  [부동산 거래유형]")
        for d, c in rows:
            print(f"    {d}: {c:>5,}건")
        print("=" * 50)


if __name__ == "__main__":
    show()
