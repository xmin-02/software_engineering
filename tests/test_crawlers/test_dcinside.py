from unittest.mock import patch, MagicMock

import pytest

from crawler.opinion.dcinside import DCInsideCrawler

MOCK_LIST_HTML = """
<html><body><table>
<tr class="ub-content">
  <td class="gall_num">-</td>
  <td class="gall_tit"><a href="javascript:;">광고</a></td>
  <td class="gall_writer" data-nick="ad"></td>
  <td class="gall_date" title=""></td>
</tr>
<tr class="ub-content">
  <td class="gall_num">100</td>
  <td class="gall_tit"><a href="/mgallery/board/view/?id=cheonan&no=100&page=1">천안 교통 문제</a></td>
  <td class="gall_writer" data-nick="시민A"></td>
  <td class="gall_date" title="2026-03-17 10:00:00"></td>
</tr>
<tr class="ub-content">
  <td class="gall_num">99</td>
  <td class="gall_tit"><a href="/mgallery/board/view/?id=cheonan&no=99&page=1">안서동 맛집 추천</a></td>
  <td class="gall_writer" data-nick="맛집러"></td>
  <td class="gall_date" title="2026-03-16 15:30:00"></td>
</tr>
</table></body></html>
"""

MOCK_VIEW_HTML = """
<html><body>
<div class="write_div">천안 교통이 너무 안 좋아요. 버스도 잘 안 오고.</div>
</body></html>
"""


@pytest.fixture
def crawler():
    return DCInsideCrawler(max_pages=1)


def _mock_get(url, **kwargs):
    """URL에 따라 다른 응답 반환"""
    resp = MagicMock()
    resp.status_code = 200
    resp.raise_for_status = MagicMock()
    if "lists" in url:
        resp.text = MOCK_LIST_HTML
    else:
        resp.text = MOCK_VIEW_HTML
    return resp


def test_list_page_filters_ads(crawler):
    """광고(num='-') 행은 제외하고 실제 게시글만 파싱"""
    with patch.object(crawler.session, "get", side_effect=_mock_get):
        posts = crawler._fetch_list_page(1)

    assert len(posts) == 2
    assert posts[0]["no"] == "100"
    assert posts[0]["title"] == "천안 교통 문제"
    assert posts[1]["no"] == "99"


def test_crawl_fetches_content(crawler):
    """목록 파싱 후 상세 본문까지 수집"""
    with patch.object(crawler.session, "get", side_effect=_mock_get):
        data = crawler.crawl()

    assert len(data) == 2
    assert data[0]["source"] == "dcinside"
    assert data[0]["source_id"] == "dc_cheonan_100"
    assert "교통" in data[0]["content"]
    assert data[0]["published_at"].year == 2026


def test_parse_date(crawler):
    """날짜 파싱 정상 동작"""
    dt = crawler._parse_date("2026-03-17 10:00:00")
    assert dt.year == 2026
    assert dt.month == 3
    assert dt.day == 17

    assert crawler._parse_date("invalid") is None
    assert crawler._parse_date(None) is None
