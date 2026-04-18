import httpx
from bs4 import BeautifulSoup
from app.models.property import PropertyCreate
from app.core.regions import REGION_CODES, SIDO_CODES, get_region_code
import re
import asyncio
from dataclasses import dataclass, field


@dataclass
class ScrapeResult:
    """크롤링 결과 + 상태 정보"""
    success: bool = False
    status_code: int = 0
    error_message: str = ""
    items: list = field(default_factory=list)
    source_url: str = ""
    source_name: str = ""

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "status_code": self.status_code,
            "error_message": self.error_message,
            "source_name": self.source_name,
            "total": len(self.items),
            "source_url": self.source_url,
            "items": [p.model_dump() if hasattr(p, "model_dump") else p for p in self.items],
        }


def _parse_price_to_number(price_str: str) -> int:
    """가격 문자열을 만원 단위 숫자로 변환"""
    price_str = price_str.replace(",", "").replace(" ", "")
    total = 0
    match_eok = re.search(r"(\d+)억", price_str)
    match_man = re.search(r"억(\d+)|^(\d+)$", price_str)
    if match_eok:
        total += int(match_eok.group(1)) * 10000
    if match_man:
        val = match_man.group(1) or match_man.group(2)
        if val:
            total += int(val)
    return total


# ==============================================================================
# 네이버 부동산
# ==============================================================================
class NaverRealEstateScraper:
    """네이버 부동산 매물 검색 크롤러"""

    BASE_URL = "https://new.land.naver.com/api"
    SOURCE_NAME = "네이버부동산"

    HEADERS = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Referer": "https://new.land.naver.com/",
    }

    MAX_RETRIES = 2
    RETRY_DELAY = 2.0

    PROPERTY_TYPE_MAP = {
        "아파트": "APT", "오피스텔": "OPST", "빌라": "VL", "원룸": "OR", "상가": "SG",
    }
    TRADE_TYPE_MAP = {
        "매매": "A1", "전세": "B1", "월세": "B2",
    }
    ERROR_MESSAGES = {
        429: "네이버 API 요청 한도 초과 (429). 잠시 후 다시 시도해주세요.",
        403: "네이버 API 접근이 차단되었습니다 (403).",
        0: "네이버 서버에 연결할 수 없습니다.",
    }

    def _find_region_code(self, sido: str, sigungu: str) -> str | None:
        code = get_region_code(sido, sigungu)
        if code:
            return code
        for sido_regions in REGION_CODES.values():
            if sigungu in sido_regions:
                return sido_regions[sigungu]
        return None

    async def search_properties(
        self, sido: str = "서울특별시", sigungu: str = "강남구",
        property_type: str = "아파트", trade_type: str = "매매", page: int = 1,
    ) -> ScrapeResult:
        region_code = self._find_region_code(sido, sigungu) or "1168000000"
        prop_code = self.PROPERTY_TYPE_MAP.get(property_type, "APT")
        trade_code = self.TRADE_TYPE_MAP.get(trade_type, "A1")
        region_display = f"{sido} {sigungu}"
        request_url = f"{self.BASE_URL}/articles"
        result = ScrapeResult(source_url=request_url, source_name=self.SOURCE_NAME)

        for attempt in range(self.MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        request_url,
                        params={
                            "cortarNo": region_code, "realEstateType": prop_code,
                            "tradeType": trade_code, "page": page, "sameAddressGroup": "true",
                        },
                        headers=self.HEADERS, timeout=15.0,
                    )
                    result.status_code = response.status_code

                    if response.status_code == 200:
                        data = response.json()
                        for article in data.get("articleList", []):
                            price_str = article.get("dealOrWarrantPrc", "0")
                            result.items.append(PropertyCreate(
                                title=article.get("articleName", ""),
                                property_type=property_type, trade_type=trade_type,
                                price=price_str, price_number=_parse_price_to_number(price_str),
                                area=float(article.get("area2", 0)),
                                floor=article.get("floorInfo", ""),
                                address=article.get("articleRealEstateTypeName", ""),
                                region=region_display,
                                description=article.get("articleFeatureDesc", ""),
                                source="네이버부동산",
                                source_url=f"https://new.land.naver.com/articles/{article.get('articleNo', '')}",
                                image_url=article.get("representativeImgUrl", ""),
                            ))
                        result.success = True
                        if not result.items:
                            result.error_message = "검색 조건에 맞는 매물이 없습니다."
                        return result

                    elif response.status_code == 429 and attempt < self.MAX_RETRIES:
                        await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
                        continue
                    else:
                        result.error_message = self.ERROR_MESSAGES.get(
                            response.status_code, f"네이버 API 오류 (HTTP {response.status_code})")
                        if attempt < self.MAX_RETRIES:
                            await asyncio.sleep(self.RETRY_DELAY)
                            continue
                        return result

            except (httpx.TimeoutException, httpx.ConnectError):
                result.status_code = 0
                result.error_message = self.ERROR_MESSAGES[0]
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_DELAY)
                    continue
            except Exception as e:
                result.error_message = f"네이버 크롤링 오류: {str(e)}"
                return result

        return result


# ==============================================================================
# 다방
# ==============================================================================
class DabangScraper:
    """다방 매물 검색 크롤러"""

    SOURCE_NAME = "다방"
    BASE_URL = "https://www.dabangapp.com/api/3"

    HEADERS = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Referer": "https://www.dabangapp.com/",
        "d-api-version": "5.0.0",
        "d-call-type": "web",
    }

    MAX_RETRIES = 2
    RETRY_DELAY = 2.0

    # 다방 지역 좌표 매핑 (주요 시/군/구 중심 좌표)
    REGION_COORDS = {
        "강남구": {"lat": 37.5172, "lng": 127.0473},
        "서초구": {"lat": 37.4837, "lng": 127.0324},
        "송파구": {"lat": 37.5145, "lng": 127.1059},
        "마포구": {"lat": 37.5663, "lng": 126.9014},
        "용산구": {"lat": 37.5326, "lng": 126.9900},
        "성동구": {"lat": 37.5634, "lng": 127.0369},
        "영등포구": {"lat": 37.5264, "lng": 126.8963},
        "강서구": {"lat": 37.5510, "lng": 126.8495},
        "노원구": {"lat": 37.6542, "lng": 127.0568},
        "분당구": {"lat": 37.3825, "lng": 127.1188},
        "수원시": {"lat": 37.2636, "lng": 127.0286},
        "해운대구": {"lat": 35.1631, "lng": 129.1636},
        "중구": {"lat": 37.5640, "lng": 126.9975},
    }

    TRADE_TYPE_MAP = {
        "매매": "SELL", "전세": "LEASE", "월세": "MONTHLY_RENT",
    }

    ROOM_TYPE_MAP = {
        "원룸": "ONE_ROOM", "오피스텔": "OFFICETEL", "아파트": "APARTMENT", "빌라": "VILLA",
    }

    def _get_coords(self, sigungu: str) -> dict:
        for key, coords in self.REGION_COORDS.items():
            if key in sigungu:
                return coords
        return {"lat": 37.5665, "lng": 126.9780}  # 서울 기본값

    async def search_properties(
        self, sido: str = "서울특별시", sigungu: str = "강남구",
        property_type: str = "원룸", trade_type: str = "월세", page: int = 1,
    ) -> ScrapeResult:
        coords = self._get_coords(sigungu)
        room_type = self.ROOM_TYPE_MAP.get(property_type, "ONE_ROOM")
        selling_type = self.TRADE_TYPE_MAP.get(trade_type, "MONTHLY_RENT")
        region_display = f"{sido} {sigungu}"

        request_url = f"{self.BASE_URL}/room/list"
        result = ScrapeResult(source_url="https://www.dabangapp.com", source_name=self.SOURCE_NAME)

        params = {
            "filters": f'{{"sellingTypeList":["{selling_type}"],"roomTypeList":["{room_type}"]}}',
            "page": page,
            "zoom": 15,
            "lat": coords["lat"],
            "lng": coords["lng"],
        }

        for attempt in range(self.MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        request_url, params=params,
                        headers=self.HEADERS, timeout=15.0,
                    )
                    result.status_code = response.status_code

                    if response.status_code == 200:
                        data = response.json()
                        rooms = data.get("rooms", data.get("result", []))
                        if isinstance(rooms, dict):
                            rooms = rooms.get("list", [])

                        for room in rooms:
                            price_str = room.get("priceTitle", room.get("price", "0"))
                            title = room.get("title", room.get("roomTitle", ""))
                            area_val = room.get("roomSize", room.get("exclusiveArea", 0))

                            result.items.append(PropertyCreate(
                                title=title or f"다방 매물",
                                property_type=property_type, trade_type=trade_type,
                                price=str(price_str),
                                price_number=_parse_price_to_number(str(price_str)),
                                area=float(area_val) if area_val else 0,
                                floor=str(room.get("floor", room.get("floorInfo", ""))),
                                address=room.get("location", room.get("address", "")),
                                region=region_display,
                                description=room.get("desc", room.get("description", "")),
                                source="다방",
                                source_url=f"https://www.dabangapp.com/room/{room.get('id', room.get('roomId', ''))}",
                                image_url=room.get("imgUrl", room.get("thumbnail", "")),
                            ))

                        result.success = True
                        if not result.items:
                            result.error_message = "다방에서 해당 조건의 매물을 찾지 못했습니다."
                        return result

                    elif response.status_code == 429 and attempt < self.MAX_RETRIES:
                        await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
                        continue
                    else:
                        result.error_message = f"다방 API 오류 (HTTP {response.status_code})"
                        if attempt < self.MAX_RETRIES:
                            await asyncio.sleep(self.RETRY_DELAY)
                            continue
                        return result

            except (httpx.TimeoutException, httpx.ConnectError):
                result.error_message = "다방 서버에 연결할 수 없습니다."
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_DELAY)
                    continue
            except Exception as e:
                result.error_message = f"다방 크롤링 오류: {str(e)}"
                return result

        return result


# ==============================================================================
# 부동산114
# ==============================================================================
class R114Scraper:
    """부동산114 매물 검색 크롤러 (웹 스크래핑)"""

    SOURCE_NAME = "부동산114"
    BASE_URL = "https://www.r114.com"

    HEADERS = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Referer": "https://www.r114.com/",
    }

    # 부동산114 API 헤더
    API_HEADERS = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "ko-KR,ko;q=0.9",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Referer": "https://www.r114.com/",
        "Origin": "https://www.r114.com",
    }

    MAX_RETRIES = 2
    RETRY_DELAY = 2.0

    TRADE_TYPE_MAP = {
        "매매": "sale", "전세": "charter", "월세": "monthly",
    }

    async def search_properties(
        self, sido: str = "서울특별시", sigungu: str = "강남구",
        property_type: str = "아파트", trade_type: str = "매매", page: int = 1,
    ) -> ScrapeResult:
        region_display = f"{sido} {sigungu}"
        trade_code = self.TRADE_TYPE_MAP.get(trade_type, "sale")
        search_keyword = f"{sigungu} {property_type}"
        search_url = f"{self.BASE_URL}/apt/search?query={search_keyword}"
        result = ScrapeResult(source_url=search_url, source_name=self.SOURCE_NAME)

        for attempt in range(self.MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient() as client:
                    # 부동산114 매물 검색 API
                    api_url = f"https://apt.r114.com/api/apt/search"
                    response = await client.get(
                        api_url,
                        params={
                            "keyword": f"{sigungu} {property_type}",
                            "tradeType": trade_code,
                            "page": page,
                            "pageSize": 20,
                        },
                        headers=self.API_HEADERS,
                        timeout=15.0,
                    )
                    result.status_code = response.status_code

                    if response.status_code == 200:
                        try:
                            data = response.json()
                            items = data.get("list", data.get("data", data.get("items", [])))
                            if isinstance(items, dict):
                                items = items.get("list", [])

                            for item in items:
                                price_str = item.get("price", item.get("dealPrice", "0"))
                                result.items.append(PropertyCreate(
                                    title=item.get("aptName", item.get("name", "")),
                                    property_type=property_type, trade_type=trade_type,
                                    price=str(price_str),
                                    price_number=_parse_price_to_number(str(price_str)),
                                    area=float(item.get("area", item.get("exclusiveArea", 0))),
                                    floor=str(item.get("floor", "")),
                                    address=item.get("address", item.get("addr", "")),
                                    region=region_display,
                                    description=item.get("description", ""),
                                    source="부동산114",
                                    source_url=f"https://www.r114.com/apt/{item.get('aptId', item.get('id', ''))}",
                                    image_url=item.get("imgUrl", ""),
                                ))
                        except Exception:
                            pass

                        # API 결과 없으면 웹 스크래핑 시도
                        if not result.items:
                            await self._scrape_web(result, sigungu, property_type, trade_type, region_display, client)

                        result.success = True
                        if not result.items:
                            result.error_message = "부동산114에서 해당 조건의 매물을 찾지 못했습니다."
                        return result

                    else:
                        # API 실패시 웹 스크래핑 시도
                        async with httpx.AsyncClient() as client2:
                            await self._scrape_web(result, sigungu, property_type, trade_type, region_display, client2)
                            if result.items:
                                result.success = True
                                result.status_code = 200
                                return result

                        result.error_message = f"부동산114 오류 (HTTP {response.status_code})"
                        if attempt < self.MAX_RETRIES:
                            await asyncio.sleep(self.RETRY_DELAY)
                            continue
                        return result

            except (httpx.TimeoutException, httpx.ConnectError):
                result.error_message = "부동산114 서버에 연결할 수 없습니다."
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_DELAY)
                    continue
            except Exception as e:
                result.error_message = f"부동산114 크롤링 오류: {str(e)}"
                return result

        return result

    async def _scrape_web(self, result: ScrapeResult, sigungu: str,
                          property_type: str, trade_type: str,
                          region_display: str, client: httpx.AsyncClient):
        """부동산114 웹 페이지 스크래핑 fallback"""
        try:
            search_url = f"https://www.r114.com/apt/search?query={sigungu}+{property_type}"
            response = await client.get(search_url, headers=self.HEADERS, timeout=15.0, follow_redirects=True)

            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "lxml")
                items = soup.select(".item_area, .complex_item, .search_item, .apt_item")

                for item in items:
                    title_el = item.select_one(".title, .name, .complex_name, .apt_name")
                    price_el = item.select_one(".price, .cost, .deal_price")
                    area_el = item.select_one(".area, .size, .exclusive_area")
                    addr_el = item.select_one(".address, .addr, .location")

                    if title_el:
                        price_text = price_el.get_text(strip=True) if price_el else ""
                        result.items.append(PropertyCreate(
                            title=title_el.get_text(strip=True),
                            property_type=property_type, trade_type=trade_type,
                            price=price_text,
                            price_number=_parse_price_to_number(price_text),
                            area=0,
                            floor="",
                            address=addr_el.get_text(strip=True) if addr_el else "",
                            region=region_display,
                            description="",
                            source="부동산114",
                            source_url=search_url,
                            image_url="",
                        ))
        except Exception:
            pass


# ==============================================================================
# 네이버 웹 검색 (기존)
# ==============================================================================
class WebScraper:
    """범용 웹 스크래핑 (네이버 부동산 웹 페이지)"""

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    }

    async def scrape_naver_search(self, keyword: str) -> ScrapeResult:
        search_url = f"https://search.naver.com/search.naver?query={keyword}+부동산"
        result = ScrapeResult(source_url=search_url, source_name="네이버검색")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    search_url, headers=self.HEADERS, timeout=15.0, follow_redirects=True,
                )
                result.status_code = response.status_code

                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "lxml")
                    items = soup.select(".realty_item, .property_item, .lst_item")
                    for item in items:
                        title_el = item.select_one(".title, .name, .item_title")
                        price_el = item.select_one(".price, .cost, .item_price")
                        area_el = item.select_one(".area, .size, .item_area")
                        if title_el:
                            result.items.append({
                                "title": title_el.get_text(strip=True),
                                "price": price_el.get_text(strip=True) if price_el else "",
                                "area": area_el.get_text(strip=True) if area_el else "",
                                "source": "네이버검색",
                            })
                    result.success = True
                    if not result.items:
                        result.error_message = "검색 결과가 없습니다."
                else:
                    result.error_message = f"네이버 검색 오류 (HTTP {response.status_code})"
        except Exception as e:
            result.error_message = f"웹 검색 오류: {str(e)}"
        return result


# ==============================================================================
# 통합 검색
# ==============================================================================
class IntegratedScraper:
    """여러 소스를 동시에 검색하여 통합 결과 반환"""

    def __init__(self):
        self.naver = NaverRealEstateScraper()
        self.dabang = DabangScraper()
        self.r114 = R114Scraper()

    async def search_all(
        self, sido: str, sigungu: str,
        property_type: str, trade_type: str,
        sources: list[str] | None = None, page: int = 1,
    ) -> dict:
        """선택된 소스에서 병렬 검색"""
        if sources is None:
            sources = ["naver", "dabang", "r114"]

        tasks = []
        source_names = []

        if "naver" in sources:
            tasks.append(self.naver.search_properties(sido, sigungu, property_type, trade_type, page))
            source_names.append("네이버부동산")
        if "dabang" in sources:
            tasks.append(self.dabang.search_properties(sido, sigungu, property_type, trade_type, page))
            source_names.append("다방")
        if "r114" in sources:
            tasks.append(self.r114.search_properties(sido, sigungu, property_type, trade_type, page))
            source_names.append("부동산114")

        results = await asyncio.gather(*tasks, return_exceptions=True)

        all_items = []
        source_results = []

        for i, res in enumerate(results):
            if isinstance(res, Exception):
                source_results.append({
                    "source_name": source_names[i],
                    "success": False,
                    "status_code": 0,
                    "error_message": str(res),
                    "total": 0,
                })
            else:
                source_results.append({
                    "source_name": res.source_name,
                    "success": res.success,
                    "status_code": res.status_code,
                    "error_message": res.error_message,
                    "total": len(res.items),
                })
                all_items.extend(res.items)

        return {
            "all_items": all_items,
            "source_results": source_results,
            "total": len(all_items),
        }


# 인스턴스 생성
scraper = NaverRealEstateScraper()
dabang_scraper = DabangScraper()
r114_scraper = R114Scraper()
web_scraper = WebScraper()
integrated_scraper = IntegratedScraper()
