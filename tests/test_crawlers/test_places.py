from unittest.mock import patch, MagicMock

import pytest

from crawler.places.naver_place import NaverPlaceCrawler
from crawler.places.blog_review import BlogReviewCrawler


# ===== NaverPlaceCrawler =====

@pytest.fixture
def place_crawler():
    return NaverPlaceCrawler(queries=["천안 맛집"], display=5, max_start=6)


MOCK_LOCAL_RESPONSE = {
    "items": [
        {
            "title": "<b>천안</b> 맛집 A",
            "address": "충청남도 천안시 동남구 안서동 123",
            "category": "음식점>한식",
            "telephone": "041-555-1234",
            "link": "https://place.naver.com/1",
            "mapx": "1271729549",
            "mapy": "368343620",
        },
        {
            "title": "서울 맛집 B",
            "address": "서울특별시 강남구 역삼동 456",
            "category": "음식점>양식",
            "telephone": "",
            "link": "https://place.naver.com/2",
            "mapx": "1270000000",
            "mapy": "375000000",
        },
        {
            "title": "천안 술집 C",
            "address": "충청남도 천안시 동남구 신부동 789",
            "category": "음식점>술집>이자카야",
            "telephone": "",
            "link": "https://place.naver.com/3",
            "mapx": "1271800000",
            "mapy": "368300000",
        },
    ]
}


def test_place_filters_non_cheonan(place_crawler):
    """천안 외 지역 장소 필터링"""
    mock_resp = MagicMock()
    mock_resp.json.return_value = MOCK_LOCAL_RESPONSE
    mock_resp.raise_for_status = MagicMock()

    with patch("crawler.places.naver_place.requests.get", return_value=mock_resp):
        data = place_crawler.crawl()

    # 서울 맛집 B는 제외되어야 함
    assert len(data) == 2
    assert all("천안" in d["address"] for d in data)


def test_place_detects_alcohol(place_crawler):
    """술집 카테고리 감지"""
    mock_resp = MagicMock()
    mock_resp.json.return_value = MOCK_LOCAL_RESPONSE
    mock_resp.raise_for_status = MagicMock()

    with patch("crawler.places.naver_place.requests.get", return_value=mock_resp):
        data = place_crawler.crawl()

    non_alcohol = [d for d in data if not d["is_alcohol_only"]]
    alcohol = [d for d in data if d["is_alcohol_only"]]
    assert len(non_alcohol) == 1
    assert len(alcohol) == 1
    assert "술집" in alcohol[0]["name"] or alcohol[0]["is_alcohol_only"]


def test_place_cleans_html(place_crawler):
    """HTML 태그 제거"""
    assert place_crawler._clean_html("<b>천안</b> 맛집") == "천안 맛집"


# ===== BlogReviewCrawler =====

@pytest.fixture
def review_crawler():
    return BlogReviewCrawler(display=5, max_start=6)


MOCK_BLOG_RESPONSE = {
    "items": [
        {
            "title": "천안 맛집 후기",
            "link": "https://blog.naver.com/test/1001",
            "description": "<b>천안</b>에서 가장 맛있는 <b>맛집</b>을 다녀왔습니다.",
            "postdate": "20260317",
        },
        {
            "title": "안서동 카페 방문기",
            "link": "https://blog.naver.com/test/1002",
            "description": "분위기 좋고 &amp; 커피도 맛있어요",
            "postdate": "20260316",
        },
    ]
}


def test_review_fetches_and_cleans(review_crawler):
    """리뷰 수집 시 HTML 정리 + 날짜 파싱"""
    mock_resp = MagicMock()
    mock_resp.json.return_value = MOCK_BLOG_RESPONSE
    mock_resp.raise_for_status = MagicMock()

    with patch("crawler.places.blog_review.requests.get", return_value=mock_resp):
        reviews = review_crawler._fetch_reviews("테스트맛집")

    assert len(reviews) == 2
    assert "천안" in reviews[0]["review_text"]
    assert "<b>" not in reviews[0]["review_text"]
    assert "&amp;" not in reviews[1]["review_text"]
    assert reviews[0]["published_at"].year == 2026


def test_review_parse_date(review_crawler):
    """날짜 파싱"""
    assert review_crawler._parse_date("20260317").day == 17
    assert review_crawler._parse_date("invalid") is None
    assert review_crawler._parse_date(None) is None
