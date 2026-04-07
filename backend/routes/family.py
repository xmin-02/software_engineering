import requests
import xmltodict
from fastapi import APIRouter, Query

router = APIRouter(prefix="/api/family", tags=["Family"])

def format_price_text(val_obj):
    if val_obj is None: return "0만원"
    val_str = str(val_obj).replace(',', '').strip()
    val_str = ''.join(filter(str.isdigit, val_str))
    if not val_str: return "0만원"
    try:
        val = int(val_str)
        if val >= 10000:
            eok, man = val // 10000, val % 10000
            return f"{eok}억 {man}만원" if man > 0 else f"{eok}억원"
        return f"{val}만원"
    except: return "0만원"

def get_pure_number(val_obj):
    if val_obj is None: return 0
    val_str = str(val_obj).replace(',', '').strip()
    val_str = ''.join(filter(str.isdigit, val_str))
    return int(val_str) if val_str else 0

@router.get("/real-estate")
def list_real_estate(property_type: str = Query(None), deal_type: str = Query(None)):
    service_key = "9dcc8c3865fad7bbc7a53c508855630a556546379e2494c5ed069fbcb7313368"
    locations = [{"name": "동남구", "code": "44131"}, {"name": "서북구", "code": "44133"}]
    target_months = ["202603", "202604"]
    all_results = []
    item_id = 1

    urls = {
        "아파트": {
            "trade": "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade",
            "rent": "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
            "name_key": "aptNm", "area_key": "excluUseAr"
        },
        "빌라": {
            "trade": "https://apis.data.go.kr/1613000/RTMSDataSvcRHTrade/getRTMSDataSvcRHTrade",
            "rent": "https://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent",
            "name_key": "mhouseNm", "area_key": "excluUseAr"
        },
        "오피스텔": {
            "trade": "https://apis.data.go.kr/1613000/RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade",
            "rent": "https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
            "name_key": "offiNm", "area_key": "excluUseAr"
        },
        "단독주택": {
            "trade": "https://apis.data.go.kr/1613000/RTMSDataSvcSHTrade/getRTMSDataSvcSHTrade",
            "rent": "https://apis.data.go.kr/1613000/RTMSDataSvcSHRent/getRTMSDataSvcSHRent",
            "name_key": "houseType", "area_key": "totalFloorAr"
        },
        "상가": {
            "trade": "https://apis.data.go.kr/1613000/RTMSDataSvcNrgTrade/getRTMSDataSvcNrgTrade",
            "rent": None,
            "name_key": "buildingUse", "area_key": "buildingAr"
        }
    }

    for p_label, info in urls.items():
        if property_type and property_type != p_label:
            continue

        for loc in locations:
            for month in target_months:
                if info["trade"] and (not deal_type or deal_type == "매매"):
                    try:
                        res = requests.get(info["trade"], params={'serviceKey': service_key, 'LAWD_CD': loc['code'], 'DEAL_YMD': month})
                        data = xmltodict.parse(res.content).get('response', {}).get('body', {}).get('items', {})
                        if data and 'item' in data:
                            items = data['item']
                            if not isinstance(items, list): items = [items]
                            for item in items:
                                raw_price = get_pure_number(item.get('dealAmount'))
                                name = item.get(info["name_key"], "-")
                                f_val = str(item.get('floor', '')).strip()
                                if not f_val or f_val in ['None', '0']: f_val = '-'
                                
                                all_results.append({
                                    "id": item_id,
                                    "address": f"천안시 {loc['name']} {item.get('umdNm')} {name}".strip(),
                                    "property_type": p_label, "deal_type": "매매",
                                    "price": raw_price, "display_price": format_price_text(raw_price),
                                    "area": float(item.get(info["area_key"], 0)), "floor": f_val,
                                    "transaction_date": f"{item.get('dealYear')}-{str(item.get('dealMonth')).zfill(2)}-{str(item.get('dealDay')).zfill(2)}"
                                })
                                item_id += 1
                    except: pass

                if info["rent"] and (not deal_type or deal_type in ["전세", "월세"]):
                    try:
                        res = requests.get(info["rent"], params={'serviceKey': service_key, 'LAWD_CD': loc['code'], 'DEAL_YMD': month})
                        data = xmltodict.parse(res.content).get('response', {}).get('body', {}).get('items', {})
                        if data and 'item' in data:
                            items = data['item']
                            if not isinstance(items, list): items = [items]
                            for item in items:
                                rent = get_pure_number(item.get('monthlyRent'))
                                depo = get_pure_number(item.get('deposit'))
                                dtype = "월세" if rent > 0 else "전세"
                                if deal_type and deal_type != dtype: continue
                                p_text = format_price_text(depo) if dtype == "전세" else f"{format_price_text(depo)} / {rent}만원"
                                name = item.get(info["name_key"], "-")
                                f_val = str(item.get('floor', '')).strip()
                                if not f_val or f_val in ['None', '0']: f_val = '-'

                                all_results.append({
                                    "id": item_id,
                                    "address": f"천안시 {loc['name']} {item.get('umdNm')} {name}".strip(),
                                    "property_type": p_label, "deal_type": dtype,
                                    "price": depo, "display_price": p_text,
                                    "area": float(item.get(info["area_key"], 0)), "floor": f_val,
                                    "transaction_date": f"{item.get('dealYear')}-{str(item.get('dealMonth')).zfill(2)}-{str(item.get('dealDay')).zfill(2)}"
                                })
                                item_id += 1
                    except: pass

    all_results.sort(key=lambda x: x['transaction_date'], reverse=True)
    return all_results
