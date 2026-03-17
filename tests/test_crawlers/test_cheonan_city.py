from unittest.mock import patch, MagicMock

import pytest

from crawler.opinion.cheonan_city import CheonanCityCrawler

MOCK_LIST_HTML = """
<html><body><table><tbody>
<tr>
  <td class="board__table--count">100</td>
  <td class="board__table--title">
    <button class="board__link" onclick="fn_search_detail('ART001'); return false;">
      <div class="board__subject-content">
        <div class="board__subject-text-wrap type1">
          <span class="board__subject-text">천안시 버스 개선 요청</span>
        </div>
      </div>
    </button>
  </td>
  <td class="board__table--writer">시민A</td>
  <td class="board__table--date">2026-03-17</td>
</tr>
<tr>
  <td class="board__table--count">99</td>
  <td class="board__table--title">
    <button class="board__link" onclick="fn_search_detail('ART002'); return false;">
      <div class="board__subject-content">
        <div class="board__subject-text-wrap type1">
          <span class="board__subject-text">공무원 친절 칭찬</span>
        </div>
      </div>
    </button>
  </td>
  <td class="board__table--writer">시민B</td>
  <td class="board__table--date">2026-03-16</td>
</tr>
</tbody></table></body></html>
"""

MOCK_VIEW_HTML = """
<html><body>
<div class="board-view__contents">
  <div class="board-view__contents-inner">
    천안시 버스 노선이 부족하여 출퇴근이 불편합니다. 개선을 요청합니다.
  </div>
</div>
</body></html>
"""


@pytest.fixture
def crawler():
    return CheonanCityCrawler(max_pages=1, board_keys=["praise"])


def _mock_get(url, **kwargs):
    resp = MagicMock()
    resp.status_code = 200
    resp.raise_for_status = MagicMock()
    if "list.do" in url:
        resp.text = MOCK_LIST_HTML
    else:
        resp.text = MOCK_VIEW_HTML
    return resp


def test_list_page_parses_posts(crawler):
    """게시판 목록에서 게시글 정보 파싱"""
    with patch.object(crawler.session, "get", side_effect=_mock_get):
        posts = crawler._fetch_list_page("BBSMSTR_000000000072", 1)

    assert len(posts) == 2
    assert posts[0]["article_id"] == "ART001"
    assert posts[0]["title"] == "천안시 버스 개선 요청"
    assert posts[0]["author"] == "시민A"
    assert posts[1]["article_id"] == "ART002"


def test_crawl_fetches_content(crawler):
    """목록 + 상세 본문 수집"""
    with patch.object(crawler.session, "get", side_effect=_mock_get):
        data = crawler.crawl()

    assert len(data) == 2
    assert data[0]["source"] == "cheonan_city"
    assert data[0]["source_id"] == "ca_ART001"
    assert "버스" in data[0]["content"]
    assert data[0]["published_at"].year == 2026


def test_parse_date(crawler):
    """다양한 날짜 형식 파싱"""
    assert crawler._parse_date("2026-03-17").year == 2026
    assert crawler._parse_date("2026.03.17").year == 2026
    assert crawler._parse_date("2026-03-17 10:00:00").hour == 10
    assert crawler._parse_date("invalid") is None
    assert crawler._parse_date(None) is None
