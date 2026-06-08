"""청년/대학생 정보 크롤러 모듈."""

from crawler.youth.notice_content_crawler import NoticeContentCrawler
from crawler.youth.university_notice import UniversityNoticeCrawler

__all__ = ["NoticeContentCrawler", "UniversityNoticeCrawler"]
