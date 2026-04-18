#!/bin/bash
# 데이터 내보내기 스크립트
# 사용법: ./scripts/export-data.sh [format:xlsx/csv] [sort_by] [sort_order]

FORMAT=${1:-"xlsx"}
SORT_BY=${2:-"price_number"}
SORT_ORDER=${3:-"asc"}
API_URL=${API_URL:-"http://localhost:8000"}
OUTPUT_FILE="properties_$(date +%Y%m%d_%H%M%S).$FORMAT"

echo "=== 데이터 내보내기 ==="
echo "형식: $FORMAT | 정렬: $SORT_BY ($SORT_ORDER)"

curl -o "$OUTPUT_FILE" "$API_URL/api/export/download?format=$FORMAT&sort_by=$SORT_BY&sort_order=$SORT_ORDER"

echo "파일 저장 완료: $OUTPUT_FILE"
