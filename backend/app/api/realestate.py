from fastapi import APIRouter, Query, HTTPException
from app.core.database import get_db
from app.core.regions import (
    REGION_CODES,
    get_all_sido,
    get_sigungu_list,
    get_flat_region_list,
)
from app.models.property import (
    PropertyCreate,
    PropertyResponse,
    PropertySearchParams,
)
from app.services.scraper import scraper, dabang_scraper, r114_scraper, web_scraper, integrated_scraper
from datetime import datetime
from bson import ObjectId

router = APIRouter()


@router.get("/regions", summary="전국 시/도 목록 조회")
async def list_sido():
    """전국 시/도 목록 반환"""
    return {"sido_list": get_all_sido()}


@router.get("/regions/{sido}", summary="시/군/구 목록 조회")
async def list_sigungu(sido: str):
    """해당 시/도의 시/군/구 목록 반환"""
    sigungu_list = get_sigungu_list(sido)
    if not sigungu_list:
        raise HTTPException(status_code=404, detail=f"'{sido}' 시/도를 찾을 수 없습니다")
    return {"sido": sido, "sigungu_list": sigungu_list}


@router.get("/regions-all", summary="전체 지역 목록 조회")
async def list_all_regions():
    """전국 시/도 > 시/군/구 전체 구조 반환"""
    result = {}
    for sido, districts in REGION_CODES.items():
        result[sido] = list(districts.keys())
    return result


@router.get("/search", summary="부동산 매물 통합 검색 (크롤링)")
async def search_properties(
    sido: str = Query("서울특별시", description="시/도"),
    sigungu: str = Query("강남구", description="시/군/구"),
    property_type: str = Query("아파트", description="매물유형"),
    trade_type: str = Query("매매", description="거래유형"),
    sources: str = Query("naver,dabang,r114", description="출처 (naver,dabang,r114 쉼표구분)"),
    sort_by: str = Query("price_number", description="정렬 기준"),
    sort_order: str = Query("asc", description="정렬 순서 (asc/desc)"),
    page: int = Query(1, ge=1),
):
    """네이버부동산, 다방, 부동산114에서 매물을 통합 검색. 출처별 성공/실패 상태 포함."""
    source_list = [s.strip() for s in sources.split(",") if s.strip()]

    data = await integrated_scraper.search_all(
        sido=sido, sigungu=sigungu,
        property_type=property_type, trade_type=trade_type,
        sources=source_list, page=page,
    )

    items = data["all_items"]
    # 정렬
    if items:
        reverse = sort_order == "desc"
        if sort_by == "price_number":
            items.sort(key=lambda x: x.price_number, reverse=reverse)
        elif sort_by == "area":
            items.sort(key=lambda x: x.area, reverse=reverse)
        elif sort_by == "title":
            items.sort(key=lambda x: x.title, reverse=reverse)

    any_success = any(r["success"] for r in data["source_results"])
    error_messages = [
        f"[{r['source_name']}] {r['error_message']}"
        for r in data["source_results"] if not r["success"] and r["error_message"]
    ]

    return {
        "success": any_success,
        "source_results": data["source_results"],
        "error_message": " | ".join(error_messages) if error_messages else "",
        "total": len(items),
        "page": page,
        "sort_by": sort_by,
        "sort_order": sort_order,
        "items": [p.model_dump() for p in items],
    }


@router.post("/save", summary="검색 결과 DB 저장")
async def save_properties(properties: list[PropertyCreate]):
    """크롤링한 매물 데이터를 MongoDB에 저장"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="DB 연결 실패")

    now = datetime.now()
    docs = []
    for prop in properties:
        doc = prop.model_dump()
        doc["created_at"] = now
        doc["updated_at"] = now
        docs.append(doc)

    result = await db.properties.insert_many(docs)
    return {"inserted": len(result.inserted_ids)}


@router.get("/list", summary="저장된 매물 목록 조회")
async def list_properties(
    region: str = Query(None),
    property_type: str = Query(None),
    trade_type: str = Query(None),
    source: str = Query(None, description="출처 필터"),
    min_price: int = Query(None, description="최소 가격 (만원)"),
    max_price: int = Query(None, description="최대 가격 (만원)"),
    sort_by: str = Query("price_number", description="정렬 기준"),
    sort_order: str = Query("asc", description="정렬 순서"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """DB에 저장된 매물 목록을 필터/정렬하여 반환"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="DB 연결 실패")

    query = {}
    if region:
        query["region"] = {"$regex": region}
    if source:
        query["source"] = {"$regex": source}
    if property_type:
        query["property_type"] = property_type
    if trade_type:
        query["trade_type"] = trade_type
    if min_price is not None or max_price is not None:
        price_q = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        query["price_number"] = price_q

    sort_dir = 1 if sort_order == "asc" else -1
    skip = (page - 1) * page_size

    total = await db.properties.count_documents(query)
    cursor = db.properties.find(query).sort(sort_by, sort_dir).skip(skip).limit(page_size)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        items.append(doc)

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
        "sort_by": sort_by,
        "sort_order": sort_order,
        "items": items,
    }


@router.get("/web-search", summary="웹 키워드 검색")
async def web_search(keyword: str = Query(..., description="검색 키워드")):
    """네이버에서 부동산 키워드로 웹 검색"""
    result = await web_scraper.scrape_naver_search(keyword)
    return {
        "success": result.success,
        "status_code": result.status_code,
        "error_message": result.error_message,
        "keyword": keyword,
        "total": len(result.items),
        "items": result.items,
    }


@router.delete("/{property_id}", summary="매물 삭제")
async def delete_property(property_id: str):
    """저장된 매물 삭제"""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=500, detail="DB 연결 실패")

    result = await db.properties.delete_one({"_id": ObjectId(property_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="매물을 찾을 수 없습니다")
    return {"deleted": True}
