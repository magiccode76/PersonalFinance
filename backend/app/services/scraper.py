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

    def to_dict(self) -> dict:
        return {
            "success": self.success,
            "status_code": self.status_code,
            "error_message": self.error_message,
            "total": len(self.items),
            "source_url": self.source_url,
            "items": [p.model_dump() if hasattr(p, "model_dump") else p for p in self.items],
        }


class NaverRealEstateScraper:
    """네이버 부동산 매물 검색 크롤러"""

    BASE_URL = "https://new.land.naver.com/api"

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
    RETRY_DELAY = 2.0  # seconds

    PROPERTY_TYPE_MAP = {
        "아파트": "APT",
        "오피스텔": "OPST",
        "빌라": "VL",
        "원룸": "OR",
        "상가": "SG",
    }

    TRADE_TYPE_MAP = {
        "매매": "A1",
        "전세": "B1",
        "월세": "B2",
    }

    ERROR_MESSAGES = {
        429: "네이버 API 요청 한도 초과 (429). 잠시 후 다시 시도해주세요.",
        403: "네이버 API 접근이 차단되었습니다 (403). 잠시 후 다시 시도해주세요.",
        500: "네이버 서버 내부 오류 (500).",
        502: "네이버 서버 게이트웨이 오류 (502).",
        503: "네이버 서버가 일시적으로 사용 불가합니다 (503).",
        0: "네이버 서버에 연결할 수 없습니다. 네트워크를 확인해주세요.",
    }

    def _find_region_code(self, sido: str, sigungu: str) -> str | None:
        code = get_region_code(sido, sigungu)
        if code:
            return code
        for sido_regions in REGION_CODES.values():
            if sigungu in sido_regions:
                return sido_regions[sigungu]
        return None

    def _parse_price_to_number(self, price_str: str) -> int:
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

    async def search_properties(
        self,
        sido: str = "서울특별시",
        sigungu: str = "강남구",
        property_type: str = "아파트",
        trade_type: str = "매매",
        page: int = 1,
    ) -> ScrapeResult:
        """네이버 부동산 API를 통해 매물 검색 (재시도 포함)"""
        region_code = self._find_region_code(sido, sigungu) or "1168000000"
        prop_code = self.PROPERTY_TYPE_MAP.get(property_type, "APT")
        trade_code = self.TRADE_TYPE_MAP.get(trade_type, "A1")
        region_display = f"{sido} {sigungu}"

        api_params = {
            "cortarNo": region_code,
            "realEstateType": prop_code,
            "tradeType": trade_code,
            "page": page,
            "sameAddressGroup": "true",
        }

        request_url = f"{self.BASE_URL}/articles"
        result = ScrapeResult(source_url=request_url)

        for attempt in range(self.MAX_RETRIES + 1):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(
                        request_url,
                        params=api_params,
                        headers=self.HEADERS,
                        timeout=15.0,
                    )

                    result.status_code = response.status_code

                    if response.status_code == 200:
                        data = response.json()
                        articles = data.get("articleList", [])

                        properties = []
                        for article in articles:
                            price_str = article.get("dealOrWarrantPrc", "0")
                            prop = PropertyCreate(
                                title=article.get("articleName", ""),
                                property_type=property_type,
                                trade_type=trade_type,
                                price=price_str,
                                price_number=self._parse_price_to_number(price_str),
                                area=float(article.get("area2", 0)),
                                floor=article.get("floorInfo", ""),
                                address=article.get("articleRealEstateTypeName", ""),
                                region=region_display,
                                description=article.get("articleFeatureDesc", ""),
                                source="naver",
                                source_url=f"https://new.land.naver.com/articles/{article.get('articleNo', '')}",
                                image_url=article.get("representativeImgUrl", ""),
                            )
                            properties.append(prop)

                        result.success = True
                        result.items = properties
                        if not properties:
                            result.error_message = "검색 조건에 맞는 매물이 없습니다."
                        return result

                    elif response.status_code == 429 and attempt < self.MAX_RETRIES:
                        print(f"429 에러, {self.RETRY_DELAY}초 후 재시도 ({attempt + 1}/{self.MAX_RETRIES})")
                        await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
                        continue
                    else:
                        result.error_message = self.ERROR_MESSAGES.get(
                            response.status_code,
                            f"네이버 API 오류 (HTTP {response.status_code})"
                        )
                        if attempt < self.MAX_RETRIES:
                            await asyncio.sleep(self.RETRY_DELAY)
                            continue
                        return result

            except httpx.TimeoutException:
                result.status_code = 0
                result.error_message = "네이버 서버 응답 시간 초과. 잠시 후 다시 시도해주세요."
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_DELAY)
                    continue
            except httpx.ConnectError:
                result.status_code = 0
                result.error_message = self.ERROR_MESSAGES[0]
                if attempt < self.MAX_RETRIES:
                    await asyncio.sleep(self.RETRY_DELAY)
                    continue
            except Exception as e:
                result.status_code = 0
                result.error_message = f"크롤링 중 예상치 못한 오류: {str(e)}"
                return result

        return result


class WebScraper:
    """범용 웹 스크래핑 (네이버 부동산 웹 페이지)"""

    HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    }

    async def scrape_naver_search(self, keyword: str) -> ScrapeResult:
        search_url = f"https://search.naver.com/search.naver?query={keyword}+부동산"
        result = ScrapeResult(source_url=search_url)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    search_url,
                    headers=self.HEADERS,
                    timeout=15.0,
                    follow_redirects=True,
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
                                "source": "naver_search",
                            })

                    result.success = True
                    if not result.items:
                        result.error_message = "검색 결과가 없습니다."
                else:
                    result.error_message = f"네이버 검색 오류 (HTTP {response.status_code})"

        except Exception as e:
            result.error_message = f"웹 검색 오류: {str(e)}"

        return result


scraper = NaverRealEstateScraper()
web_scraper = WebScraper()
