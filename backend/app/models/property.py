from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class PropertyBase(BaseModel):
    title: str = Field(..., description="매물 제목")
    property_type: str = Field(..., description="매물 유형 (아파트/오피스텔/빌라 등)")
    trade_type: str = Field(..., description="거래 유형 (매매/전세/월세)")
    price: str = Field(..., description="가격 (예: 5억 2,000)")
    price_number: int = Field(0, description="정렬용 가격 (만원 단위)")
    area: float = Field(0, description="전용면적 (m2)")
    floor: str = Field("", description="층수")
    build_year: str = Field("", description="건축연도 (연식)")
    land_share: str = Field("", description="대지지분 (m2)")
    rooms: int = Field(0, description="방 개수")
    bathrooms: int = Field(0, description="화장실 개수")
    address: str = Field("", description="주소")
    region: str = Field("", description="지역 (시/구)")
    description: str = Field("", description="상세 설명")
    source: str = Field("", description="출처 (naver/zigbang 등)")
    source_url: str = Field("", description="원본 URL")
    image_url: str = Field("", description="이미지 URL")


class PropertyCreate(PropertyBase):
    pass


class PropertyInDB(PropertyBase):
    id: str = Field(default="", alias="_id")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True


class PropertyResponse(PropertyBase):
    id: str
    created_at: datetime
    updated_at: datetime


class PropertySearchParams(BaseModel):
    keyword: Optional[str] = None
    region: Optional[str] = None
    property_type: Optional[str] = None
    trade_type: Optional[str] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    sort_by: str = "price_number"
    sort_order: str = "asc"
    page: int = 1
    page_size: int = 20
