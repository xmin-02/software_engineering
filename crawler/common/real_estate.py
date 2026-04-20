from datetime import date
from typing import Any

import requests
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from backend.config import settings
from backend.models.content import RealEstate
from crawler.base import BaseCrawler

# 천안시 법정동코드: 동남구 44131, 서북구 44133
CHEONAN_CODES = {"동남구": "44131", "서북구": "44133"}

TRADE_API = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev"
RENT_API = "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent"


class RealEstateCrawler(BaseCrawler):
    """data.go.kr 아파트 매매/전월세 실거래가 크롤러"""

    def __init__(self, months: int = 3):
        super().__init__(source="data_go_kr")
        self.api_key = settings.data_go_kr_api_key
        self.months = months

    def _get_deal_months(self) -> list[str]:
        """최근 N개월 YYYYMM 리스트"""
        today = date.today()
        months = []
        for i in range(self.months):
            m = today.month - i
            y = today.year
            while m <= 0:
                m += 12
                y -= 1
            months.append(f"{y}{m:02d}")
        return months

    def _fetch_api(self, url: str, lawd_cd: str, deal_ym: str) -> list[dict]:
        """API 호출 → item 리스트 반환"""
        params = {
            "serviceKey": self.api_key,
            "LAWD_CD": lawd_cd,
            "DEAL_YMD": deal_ym,
            "numOfRows": 1000,
            "pageNo": 1,
        }
        try:
            resp = requests.get(url, params=params, timeout=30)
            resp.raise_for_status()
        except requests.RequestException:
            return []

        soup = BeautifulSoup(resp.text, "xml")
        return soup.find_all("item")

    def _parse_trade(self, item, district: str, deal_ym: str) -> dict[str, Any]:
        """매매 item 파싱"""
        def txt(tag: str) -> str | None:
            el = item.find(tag)
            return el.text.strip() if el else None

        day = txt("dealDay") or "1"
        deal_date_str = f"{deal_ym[:4]}-{deal_ym[4:]}-{int(day):02d}"
        return {
            "title": txt("aptNm"),
            "district": district,
            "dong": txt("umdNm"),
            "deal_type": "매매",
            "price": txt("dealAmount"),
            "area_sqm": float(txt("excluUseAr") or 0),
            "floor": txt("floor"),
            "build_year": txt("buildYear"),
            "deal_date": deal_date_str,
            "source_id": f"trade_{district}_{txt('aptNm')}_{deal_date_str}_{txt('excluUseAr')}_{txt('floor')}_{txt('dealAmount')}",
        }

    def _parse_rent(self, item, district: str, deal_ym: str) -> dict[str, Any]:
        """전월세 item 파싱"""
        def txt(tag: str) -> str | None:
            el = item.find(tag)
            return el.text.strip() if el else None

        day = txt("dealDay") or "1"
        deal_date_str = f"{deal_ym[:4]}-{deal_ym[4:]}-{int(day):02d}"
        monthly = txt("monthlyRent") or "0"
        deal_type = "월세" if monthly != "0" else "전세"
        return {
            "title": txt("aptNm"),
            "district": district,
            "dong": txt("umdNm"),
            "deal_type": deal_type,
            "deposit": txt("deposit"),
            "monthly_rent": monthly if monthly != "0" else None,
            "area_sqm": float(txt("excluUseAr") or 0),
            "floor": txt("floor"),
            "build_year": txt("buildYear"),
            "deal_date": deal_date_str,
            "source_id": f"rent_{district}_{txt('aptNm')}_{deal_date_str}_{txt('excluUseAr')}_{txt('floor')}_{txt('deposit')}_{monthly}",
        }

    def crawl(self) -> list[dict[str, Any]]:
        results = []
        months = self._get_deal_months()

        for district, code in CHEONAN_CODES.items():
            for ym in months:
                # 매매
                for item in self._fetch_api(TRADE_API, code, ym):
                    results.append(self._parse_trade(item, district, ym))
                # 전월세
                for item in self._fetch_api(RENT_API, code, ym):
                    results.append(self._parse_rent(item, district, ym))

        return results

    def save(self, data: list[dict[str, Any]], db: Session) -> int:
        existing = {r[0] for r in db.query(RealEstate.source_id).filter(
            RealEstate.source_id.isnot(None)
        ).all()}

        seen = set()
        count = 0
        for item in data:
            sid = item["source_id"]
            if sid in existing or sid in seen:
                continue
            seen.add(sid)
            db.add(RealEstate(
                title=item["title"],
                district=item["district"],
                dong=item["dong"],
                property_type="아파트",
                deal_type=item["deal_type"],
                price=item.get("price"),
                deposit=item.get("deposit"),
                monthly_rent=item.get("monthly_rent"),
                area_sqm=item["area_sqm"],
                floor=item["floor"],
                build_year=item["build_year"],
                deal_date=date.fromisoformat(item["deal_date"]),
                source="data_go_kr",
                source_id=item["source_id"],
            ))
            count += 1

        return count
