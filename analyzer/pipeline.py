import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models.post import Post
from backend.models.analysis import Analysis
from analyzer.preprocessor import TextPreprocessor
from analyzer.sentiment import SentimentAnalyzer
from analyzer.keyword import KeywordExtractor
from analyzer.topic import TopicModeler
from analyzer.summarizer import TextSummarizer
from analyzer.tagger import PlaceTagger

logger = logging.getLogger(__name__)


class AnalysisPipeline:
    """분석 파이프라인 오케스트레이터"""

    def __init__(self):
        self.preprocessor = TextPreprocessor()
        self.sentiment = SentimentAnalyzer()
        self.keyword = KeywordExtractor()
        self.topic = TopicModeler()
        self.summarizer = TextSummarizer()
        self.tagger = PlaceTagger()

    def _get_unanalyzed_posts(self, db: Session) -> list[Post]:
        """미분석 게시글 조회"""
        analyzed_ids = select(Analysis.post_id)
        return (
            db.query(Post)
            .filter(~Post.id.in_(analyzed_ids))
            .all()
        )

    def run_sentiment(self) -> int:
        """1단계: 전처리 → 감성 분석 → DB 저장"""
        db = SessionLocal()
        try:
            posts = self._get_unanalyzed_posts(db)
            if not posts:
                return 0

            analyzed = 0
            for post in posts:
                cleaned = self.preprocessor.clean(post.content)
                if not cleaned:
                    continue

                result = self.sentiment.analyze(cleaned)
                analysis = Analysis(
                    post_id=post.id,
                    sentiment=result["sentiment"],
                    emotion=result["emotion"],
                    sentiment_score=result["sentiment_score"],
                )
                db.add(analysis)
                analyzed += 1

            db.commit()
            return analyzed
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def run_keywords(self, batch_size: int = 100) -> int:
        """2단계: 키워드가 없는 분석 레코드에 키워드 추출"""
        db = SessionLocal()
        try:
            rows = (
                db.query(Analysis)
                .filter(Analysis.keywords.is_(None))
                .join(Post)
                .limit(batch_size)
                .all()
            )
            if not rows:
                return 0

            for analysis in rows:
                cleaned = self.preprocessor.clean(analysis.post.content)
                if not cleaned:
                    continue
                keywords = self.keyword.extract(cleaned, top_n=5)
                analysis.keywords = keywords

            db.commit()
            return len(rows)
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def run_topics(self, min_docs: int = 50) -> int:
        """3단계: 토픽이 없는 분석 레코드에 토픽 할당 (배치)"""
        db = SessionLocal()
        try:
            rows = (
                db.query(Analysis)
                .filter(Analysis.topic.is_(None))
                .join(Post)
                .all()
            )
            if len(rows) < min_docs:
                return 0

            # 전처리된 텍스트 준비
            texts = []
            valid_rows = []
            for analysis in rows:
                cleaned = self.preprocessor.clean(analysis.post.content)
                if cleaned:
                    texts.append(cleaned)
                    valid_rows.append(analysis)

            if len(texts) < min_docs:
                return 0

            # 배치 토픽 모델링
            topics, labels = self.topic.fit_transform(texts)
            for analysis, topic_id in zip(valid_rows, topics):
                analysis.topic = labels.get(topic_id, "기타")

            db.commit()
            return len(valid_rows)
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def run_summaries(self) -> int:
        """4단계: 주간 요약 생성"""
        from datetime import date, timedelta
        from sqlalchemy import func
        from backend.models.content import WeeklySummary

        db = SessionLocal()
        try:
            week_end = date.today()
            week_start = week_end - timedelta(days=7)

            exists = db.query(WeeklySummary).filter_by(week_start=week_start).first()
            if exists:
                return 0

            posts = (
                db.query(Post)
                .filter(Post.published_at >= week_start, Post.published_at <= week_end)
                .order_by(Post.published_at.desc())
                .limit(50)
                .all()
            )
            if not posts:
                return 0

            stats = (
                db.query(Analysis.sentiment, func.count())
                .join(Post)
                .filter(Post.published_at >= week_start, Post.published_at <= week_end)
                .group_by(Analysis.sentiment)
                .all()
            )
            stats_dict = {s: c for s, c in stats}
            total = sum(stats_dict.values())

            top_topics = (
                db.query(Analysis.topic, func.count().label("cnt"))
                .join(Post)
                .filter(
                    Post.published_at >= week_start,
                    Post.published_at <= week_end,
                    Analysis.topic.isnot(None),
                    Analysis.topic != "기타",
                )
                .group_by(Analysis.topic)
                .order_by(func.count().desc())
                .limit(5)
                .all()
            )

            context = f"기간: {week_start} ~ {week_end}, 총 {total}건"
            texts = [f"[{p.source}] {p.title or ''}: {p.content[:200]}" for p in posts]
            summary_text = self.summarizer.summarize(texts, context)

            weekly = WeeklySummary(
                week_start=week_start,
                week_end=week_end,
                summary=summary_text,
                top_topics=[t.topic for t in top_topics],
                total_posts=total,
                sentiment_ratio=stats_dict,
            )
            db.add(weekly)
            db.commit()
            return 1
        except Exception:
            db.rollback()
            logger.error("주간 요약 생성 실패", exc_info=True)
            return 0
        finally:
            db.close()

    def run_tagging(self) -> int:
        """5단계: 장소 리뷰 태깅"""
        from backend.models.place import Place, PlaceReview, PlaceTag

        db = SessionLocal()
        try:
            places = db.query(Place).all()
            tagged = 0
            for place in places:
                reviews = (
                    db.query(PlaceReview)
                    .filter(PlaceReview.place_id == place.id)
                    .all()
                )
                if not reviews:
                    continue
                texts = [r.review_text for r in reviews]
                tags = self.tagger.tag_reviews(texts)
                for tag, confidence in tags.items():
                    existing = (
                        db.query(PlaceTag)
                        .filter_by(place_id=place.id, tag=tag)
                        .first()
                    )
                    if existing:
                        existing.confidence = confidence
                        existing.source_count = len(reviews)
                    else:
                        db.add(PlaceTag(
                            place_id=place.id,
                            tag=tag,
                            confidence=confidence,
                            source_count=len(reviews),
                        ))
                tagged += 1
            db.commit()
            return tagged
        except Exception:
            db.rollback()
            logger.error("태깅 실패", exc_info=True)
            return 0
        finally:
            db.close()

    def run(self) -> dict:
        """전체 파이프라인 실행"""
        sentiment_count = self.run_sentiment()
        keyword_count = self.run_keywords(batch_size=500)
        topic_count = self.run_topics()
        summary_count = self.run_summaries()
        tagging_count = self.run_tagging()
        return {
            "sentiment": sentiment_count,
            "keywords": keyword_count,
            "topics": topic_count,
            "summaries": summary_count,
            "tagging": tagging_count,
        }
