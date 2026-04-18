from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from app.core.database import get_db
from app.core.config import settings
import io
import os
import csv
from datetime import datetime
from openpyxl import Workbook

router = APIRouter()

# 파일 저장 디렉토리
EXPORT_DIR = "/app/exports"


def _ensure_export_dir():
    os.makedirs(EXPORT_DIR, exist_ok=True)


@router.get("/info", summary="파일 저장 경로 정보")
async def export_info():
    """다운로드 파일 저장 경로 및 기존 파일 목록 반환"""
    _ensure_export_dir()
    files = []
    if os.path.exists(EXPORT_DIR):
        for f in sorted(os.listdir(EXPORT_DIR), reverse=True):
            filepath = os.path.join(EXPORT_DIR, f)
            stat = os.stat(filepath)
            files.append({
                "filename": f,
                "path": filepath,
                "size_kb": round(stat.st_size / 1024, 1),
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            })
    return {
        "export_dir": EXPORT_DIR,
        "total_files": len(files),
        "files": files,
    }


@router.get("/download", summary="매물 데이터 다운로드")
async def export_properties(
    format: str = Query("xlsx", description="파일 형식 (csv/xlsx)"),
    region: str = Query(None),
    property_type: str = Query(None),
    trade_type: str = Query(None),
    sort_by: str = Query("price_number", description="정렬 기준"),
    sort_order: str = Query("asc", description="정렬 순서"),
    save_to_server: bool = Query(False, description="서버에 파일도 저장할지 여부"),
):
    """저장된 매물 데이터를 정렬 순서대로 CSV 또는 Excel 파일로 다운로드"""
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="DB 연결 실패")

    query = {}
    if region:
        query["region"] = region
    if property_type:
        query["property_type"] = property_type
    if trade_type:
        query["trade_type"] = trade_type

    sort_dir = 1 if sort_order == "asc" else -1
    cursor = db.properties.find(query).sort(sort_by, sort_dir)

    items = []
    async for doc in cursor:
        items.append(doc)

    if not items:
        raise HTTPException(status_code=404, detail="내보낼 데이터가 없습니다")

    headers = ["제목", "유형", "거래", "가격", "면적(m2)", "층", "주소", "지역", "출처"]
    keys = ["title", "property_type", "trade_type", "price", "area", "floor", "address", "region", "source"]

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        for item in items:
            writer.writerow([item.get(k, "") for k in keys])
        output.seek(0)
        content_bytes = output.getvalue().encode("utf-8-sig")

        filename = f"properties_{timestamp}.csv"
        if save_to_server:
            _ensure_export_dir()
            filepath = os.path.join(EXPORT_DIR, filename)
            with open(filepath, "wb") as f:
                f.write(content_bytes)

        return StreamingResponse(
            io.BytesIO(content_bytes),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "X-File-Path": os.path.join(EXPORT_DIR, filename) if save_to_server else "",
                "X-File-Count": str(len(items)),
            },
        )

    # Excel (xlsx)
    wb = Workbook()
    ws = wb.active
    ws.title = "부동산 매물"
    ws.append(headers)
    for item in items:
        ws.append([item.get(k, "") for k in keys])

    for col_idx, header in enumerate(headers, 1):
        ws.column_dimensions[chr(64 + col_idx)].width = max(len(header) * 2, 12)

    output = io.BytesIO()
    wb.save(output)
    content_bytes = output.getvalue()
    output.seek(0)

    filename = f"properties_{timestamp}.xlsx"
    if save_to_server:
        _ensure_export_dir()
        filepath = os.path.join(EXPORT_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(content_bytes)

    return StreamingResponse(
        io.BytesIO(content_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "X-File-Path": os.path.join(EXPORT_DIR, filename) if save_to_server else "",
            "X-File-Count": str(len(items)),
        },
    )
