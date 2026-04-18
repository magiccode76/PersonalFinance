"""정렬/필터 유틸리티"""

SORT_FIELDS = {
    "price_number": "가격순",
    "area": "면적순",
    "title": "이름순",
    "created_at": "등록일순",
    "region": "지역순",
}


def get_sort_options() -> list[dict]:
    """사용 가능한 정렬 옵션 반환"""
    return [{"field": k, "label": v} for k, v in SORT_FIELDS.items()]
