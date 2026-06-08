"""신규 게시글 빠른 로컬 분석 보강 스크립트.

무거운 KcELECTRA/BERTopic 전체 배치가 오래 걸릴 때, 대시보드 최신성 유지를 위해
미분석 게시글에 규칙 기반 감성/키워드/토픽을 우선 생성한다.
"""

import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import select

from backend.database import SessionLocal
from backend.models.analysis import Analysis
from backend.models.post import Post

POSITIVE_WORDS = {
    "좋", "맛집", "추천", "최고", "친절", "깔끔", "예쁜", "편한", "성공", "행복",
    "감사", "즐거", "유명", "인기", "특별", "만족", "저렴", "신선", "아름",
}
NEGATIVE_WORDS = {
    "비용", "상담비용", "변호사", "음주운전", "사고", "고장", "불편", "문제", "걱정",
    "피해", "화재", "전세", "비싸", "실패", "하자", "소송", "대출", "견적",
}
STOPWORDS = {
    "천안", "천안시", "충남", "그리고", "오늘", "이번", "있는", "없는", "하기", "에서",
    "으로", "하면", "하는", "입니다", "합니다", "위한", "관련", "안내", "추천", "후기",
}
TOKEN_PATTERN = re.compile(r"[가-힣A-Za-z0-9]{2,}")


def _tokenize(text: str) -> list[str]:
    tokens = [t.strip() for t in TOKEN_PATTERN.findall(text or "")]
    return [t for t in tokens if t not in STOPWORDS and not t.isdigit()]


def _keywords(text: str, top_n: int = 5) -> list[str]:
    counts = Counter(_tokenize(text))
    return [token for token, _ in counts.most_common(top_n)]


def _sentiment(text: str) -> tuple[str, str, float]:
    positive = sum(1 for word in POSITIVE_WORDS if word in text)
    negative = sum(1 for word in NEGATIVE_WORDS if word in text)
    if positive > negative:
        return "positive", "규칙기반 긍정", min(0.95, 0.58 + positive * 0.06)
    if negative > positive:
        return "negative", "규칙기반 부정", min(0.95, 0.58 + negative * 0.06)
    return "neutral", "규칙기반 중립", 0.5


def _topic(keywords: list[str], text: str) -> str:
    joined = " ".join(keywords)
    if any(word in text for word in ["맛집", "카페", "식당", "디저트", "고기", "점심", "밥"]):
        return ", ".join((keywords + ["맛집", "카페"])[:3])
    if any(word in text for word in ["전세", "월세", "아파트", "부동산", "이사"]):
        return ", ".join((keywords + ["주거"])[:3])
    if any(word in text for word in ["병원", "임플란트", "치과", "의원"]):
        return ", ".join((keywords + ["의료"])[:3])
    if any(word in text for word in ["채용", "취업", "일자리", "공고"]):
        return ", ".join((keywords + ["일자리"])[:3])
    return joined if joined else "기타"


def analyze(limit: int | None = None) -> int:
    db = SessionLocal()
    try:
        analyzed_ids = select(Analysis.post_id)
        query = db.query(Post).filter(~Post.id.in_(analyzed_ids)).order_by(Post.published_at.desc().nullslast())
        if limit:
            query = query.limit(limit)
        count = 0
        for post in query.all():
            text = f"{post.title or ''} {post.content or ''}"
            keywords = _keywords(text)
            sentiment, emotion, score = _sentiment(text)
            db.add(Analysis(
                post_id=post.id,
                sentiment=sentiment,
                emotion=emotion,
                sentiment_score=round(score, 4),
                topic=_topic(keywords, text),
                keywords=keywords,
            ))
            count += 1
            if count % 500 == 0:
                db.commit()
        db.commit()
        return count
    finally:
        db.close()


if __name__ == "__main__":
    print({"analyzed": analyze()})
