from unittest.mock import patch, MagicMock

import pytest

from crawler.opinion.naver_blog import NaverBlogCrawler


@pytest.fixture
def crawler():
    return NaverBlogCrawler(queries=["천안"], display=5, max_start=6)


@pytest.fixture
def mock_api_response():
    return {
        "items": [
            {
                "title": "<b>천안</b> 맛집 추천",
                "link": "https://blog.naver.com/test/1001",
                "description": "<b>천안</b>에서 가장 맛있는 식당을 소개합니다.",
                "bloggername": "맛집탐방",
                "bloggerlink": "blog.naver.com/test",
                "postdate": "20260317",
            },
            {
                "title": "천안시 &amp; 안서동 카페",
                "link": "https://blog.naver.com/test/1002",
                "description": "조용하고 &quot;분위기&quot; 좋은 카페",
                "bloggername": "카페러버",
                "bloggerlink": "blog.naver.com/test2",
                "postdate": "20260316",
            },
        ]
    }


def test_clean_html(crawler):
    """HTML 태그 및 특수문자 제거 테스트"""
    assert crawler._clean_html("<b>천안</b> 맛집") == "천안 맛집"
    assert crawler._clean_html("A &amp; B") == "A & B"
    assert crawler._clean_html("&quot;hello&quot;") == '"hello"'
    assert crawler._clean_html("  공백  ") == "공백"


def test_crawl_parses_api_response(crawler, mock_api_response):
    """API 응답을 올바른 dict 형태로 파싱하는지 테스트"""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_api_response
    mock_resp.raise_for_status = MagicMock()

    with patch("crawler.opinion.naver_blog.requests.get", return_value=mock_resp):
        data = crawler.crawl()

    assert len(data) == 2
    assert data[0]["source"] == "naver_blog"
    assert data[0]["title"] == "천안 맛집 추천"
    assert data[0]["source_id"] == "https://blog.naver.com/test/1001"
    assert data[0]["author"] == "맛집탐방"
    assert data[0]["published_at"].year == 2026
    # 특수문자 치환 확인
    assert data[1]["title"] == "천안시 & 안서동 카페"
    assert '"분위기"' in data[1]["content"]


def test_crawl_deduplicates_links(crawler, mock_api_response):
    """같은 링크가 여러 번 나와도 중복 제거되는지 테스트"""
    # 같은 아이템 복제
    mock_api_response["items"].append(mock_api_response["items"][0])

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_api_response
    mock_resp.raise_for_status = MagicMock()

    with patch("crawler.opinion.naver_blog.requests.get", return_value=mock_resp):
        data = crawler.crawl()

    assert len(data) == 2
