from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import SessionLocal
from backend.models.post import Post
from backend.models.analysis import Analysis
from analyzer.preprocessor import TextPreprocessor
from analyzer.sentiment import SentimentAnalyzer
from analyzer.keyword import KeywordExtractor
from analyzer.topic import TopicModeler


class AnalysisPipeline:
    """분석 파이프라인 오케스트레이터"""

    def __init__(self):
        self.preprocessor = TextPreprocessor()
        self.sentiment = SentimentAnalyzer()
        self.keyword = KeywordExtractor()
        self.topic = TopicModeler()

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

    def run(self) -> dict:
        """전체 파이프라인 실행"""
        sentiment_count = self.run_sentiment()
        keyword_count = self.run_keywords(batch_size=500)
        topic_count = self.run_topics()
        return {
            "sentiment": sentiment_count,
            "keywords": keyword_count,
            "topics": topic_count,
        }
