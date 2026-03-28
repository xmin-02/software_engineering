"""APScheduler 기반 크롤링 + 분석 자동 스케줄러"""
import logging
from typing import Any

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from backend.database import SessionLocal

logger = logging.getLogger(__name__)


class CrawlScheduler:
    """6시간 주기로 크롤링 + 분석 파이프라인 실행"""

    def __init__(self) -> None:
        self.scheduler = BackgroundScheduler()
        self._setup_jobs()

    def _setup_jobs(self) -> None:
        """스케줄 작업 등록"""
        # 6시간 주기 크롤링
        self.scheduler.add_job(
            self._run_crawlers,
            IntervalTrigger(hours=6),
            id="crawl_job",
            name="크롤링 실행",
            replace_existing=True,
        )
        # 크롤링 30분 후 분석 실행
        self.scheduler.add_job(
            self._run_analysis,
            IntervalTrigger(hours=6, start_date="2026-01-01 00:30:00"),
            id="analysis_job",
            name="분석 파이프라인",
            replace_existing=True,
        )

    def _run_crawlers(self) -> None:
        """전체 크롤러 순차 실행"""
        logger.info("크롤링 시작")
        db = SessionLocal()
        try:
            from crawler.opinion.naver_blog import NaverBlogCrawler
            from crawler.opinion.dcinside import DCInsideCrawler
            from crawler.opinion.cheonan_city import CheonanCityCrawler
            from crawler.places.naver_place import NaverPlaceCrawler
            from crawler.places.kakao_place import KakaoPlaceCrawler
            from crawler.places.blog_review import BlogReviewCrawler
            from crawler.events.cheonan_events import CheonanEventsCrawler
            from crawler.youth.university_notice import UniversityNoticeCrawler
            from crawler.common.real_estate import RealEstateCrawler

            crawlers: list[Any] = [
                NaverBlogCrawler(),
                DCInsideCrawler(),
                CheonanCityCrawler(),
                NaverPlaceCrawler(),
                KakaoPlaceCrawler(),
                BlogReviewCrawler(),
                CheonanEventsCrawler(),
                UniversityNoticeCrawler(),
                RealEstateCrawler(),
            ]

            for crawler in crawlers:
                try:
                    data = crawler.crawl()
                    saved = crawler.save(data, db)
                    db.commit()
                    logger.info(
                        "%s: %d건 수집, %d건 저장",
                        crawler.__class__.__name__,
                        len(data),
                        saved,
                    )
                except Exception as e:
                    db.rollback()
                    logger.error("%s 실패: %s", crawler.__class__.__name__, e)

        finally:
            db.close()
        logger.info("크롤링 완료")

    def _run_analysis(self) -> None:
        """분석 파이프라인 실행"""
        logger.info("분석 파이프라인 시작")
        try:
            from analyzer.pipeline import AnalysisPipeline

            pipeline = AnalysisPipeline()
            result = pipeline.run()
            logger.info("분석 완료: %s", result)
        except Exception as e:
            logger.error("분석 파이프라인 실패: %s", e)

    def start(self) -> None:
        """스케줄러 시작"""
        self.scheduler.start()
        logger.info("스케줄러 시작됨 (6시간 주기)")

    def stop(self) -> None:
        """스케줄러 중지"""
        self.scheduler.shutdown()
        logger.info("스케줄러 중지됨")
