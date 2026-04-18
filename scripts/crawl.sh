#!/bin/bash
# 수동 크롤링 실행 스크립트
# 사용법: ./scripts/crawl.sh [지역] [매물유형] [거래유형]

REGION=${1:-"강남구"}
PROPERTY_TYPE=${2:-"아파트"}
TRADE_TYPE=${3:-"매매"}
API_URL=${API_URL:-"http://localhost:8000"}

echo "=== 부동산 크롤링 실행 ==="
echo "지역: $REGION | 유형: $PROPERTY_TYPE | 거래: $TRADE_TYPE"
echo ""

curl -s "$API_URL/api/realestate/search?region=$REGION&property_type=$PROPERTY_TYPE&trade_type=$TRADE_TYPE&sort_by=price_number&sort_order=asc" | python3 -m json.tool
