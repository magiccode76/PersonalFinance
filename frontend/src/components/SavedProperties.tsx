"use client";

import { useState, useEffect, useCallback } from "react";
import type { Property } from "@/types/property";
import { listProperties } from "@/lib/api";
import PropertyTable from "./PropertyTable";

const SOURCE_COLORS: Record<string, string> = {
  "공공데이터(실거래가 기반)": "bg-red-100 text-red-700",
  "국토교통부 실거래가": "bg-red-100 text-red-700",
  "네이버부동산": "bg-green-100 text-green-700",
  "다방": "bg-blue-100 text-blue-700",
  "부동산114": "bg-orange-100 text-orange-700",
  "카카오맵": "bg-yellow-100 text-yellow-700",
  "부동산빅데이터": "bg-purple-100 text-purple-700",
};

export default function SavedProperties() {
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState("price_number");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [regionFilter, setRegionFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [sources, setSources] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listProperties({
        region: regionFilter || undefined,
        trade_type: "매매",
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: pageSize,
        max_price: maxPrice,
      });
      setItems(data.items as unknown as Property[]);
      setTotal(data.total);
      setTotalPages(data.total_pages);

      // 출처 목록 추출
      const srcSet = new Set<string>();
      (data.items as unknown as Property[]).forEach((item) => {
        if (item.source) srcSet.add(item.source);
      });
      setSources(Array.from(srcSet));
    } catch {
      console.error("저장된 매물 조회 실패");
    } finally {
      setLoading(false);
    }
  }, [regionFilter, sortBy, sortOrder, page, pageSize, maxPrice]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* 필터 바 */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">지역 (구)</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="예: 노원구"
              value={regionFilter}
              onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">최대 가격 (만원)</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={maxPrice || ""}
              onChange={(e) => { setMaxPrice(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
            >
              <option value="">전체</option>
              <option value="30000">3억 이하</option>
              <option value="40000">4억 이하</option>
              <option value="50000">5억 이하</option>
              <option value="60000">6억 이하</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">정렬</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            >
              <option value="price_number">가격순</option>
              <option value="region">지역순</option>
              <option value="area">면적순</option>
              <option value="title">이름순</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchData}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? "조회 중..." : "조회"}
            </button>
          </div>
        </div>
      </div>

      {/* 상태 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            총 <span className="font-bold text-gray-900">{total}</span>건
          </span>
          {/* 출처 배지 */}
          <div className="flex gap-1 flex-wrap">
            {sources.map((src) => (
              <span key={src} className={`px-2 py-0.5 rounded text-xs font-medium ${SOURCE_COLORS[src] || "bg-gray-100 text-gray-700"}`}>
                {src}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <PropertyTable items={items} sortBy={sortBy} sortOrder={sortOrder} onSortChange={toggleSort} />

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:text-gray-300 hover:bg-gray-50"
          >
            이전
          </button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:text-gray-300 hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
