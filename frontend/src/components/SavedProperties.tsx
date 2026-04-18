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
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<string[]>([]);

  // 검색 조건
  const [regionFilter, setRegionFilter] = useState("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [minArea, setMinArea] = useState<string>("");
  const [maxArea, setMaxArea] = useState<string>("");
  const [minYear, setMinYear] = useState<string>("");
  const [maxYear, setMaxYear] = useState<string>("");
  const [minRooms, setMinRooms] = useState<string>("");
  const [sortBy, setSortBy] = useState("price_number");
  const [sortOrder, setSortOrder] = useState("asc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        trade_type: "매매",
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: pageSize,
      };
      if (regionFilter) params.region = regionFilter;
      if (minPrice) params.min_price = Number(minPrice);
      if (maxPrice) params.max_price = Number(maxPrice);
      if (minArea) params.min_area = Number(minArea);
      if (maxArea) params.max_area = Number(maxArea);
      if (minYear) params.min_year = minYear;
      if (maxYear) params.max_year = maxYear;
      if (minRooms) params.min_rooms = Number(minRooms);

      const data = await listProperties(params as any);
      setItems(data.items as unknown as Property[]);
      setTotal(data.total);
      setTotalPages(data.total_pages);

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
  }, [regionFilter, minPrice, maxPrice, minArea, maxArea, minYear, maxYear, minRooms, sortBy, sortOrder, page, pageSize]);

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

  const resetFilters = () => {
    setRegionFilter("");
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setMaxArea("");
    setMinYear("");
    setMaxYear("");
    setMinRooms("");
    setSortBy("price_number");
    setSortOrder("asc");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* 검색 필터 */}
      <div className="bg-white rounded-xl shadow-sm border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">검색 조건</span>
          <button onClick={resetFilters} className="text-xs text-gray-500 hover:text-blue-600">
            초기화
          </button>
        </div>

        {/* 1행: 지역, 가격 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">지역 (시/도 또는 구)</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={regionFilter}
              onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}>
              <option value="">전체</option>
              <optgroup label="시/도">
                <option value="서울특별시">서울특별시</option>
                <option value="경기도">경기도</option>
              </optgroup>
              <optgroup label="서울 구">
                {["강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구","노원구","도봉구",
                  "동대문구","동작구","마포구","서대문구","서초구","성동구","성북구","송파구","양천구",
                  "영등포구","용산구","은평구","종로구","중구","중랑구"].map(g =>
                  <option key={g} value={g}>{g}</option>
                )}
              </optgroup>
              <optgroup label="경기 시/구">
                {["수원시","성남시","고양시","용인시","부천시","안산시","안양시","남양주시","화성시",
                  "평택시","의정부시","시흥시","파주시","광명시","김포시","군포시","구리시","오산시",
                  "하남시","의왕시","양주시","포천시","이천시","안성시","동두천시"].map(g =>
                  <option key={g} value={g}>{g}</option>
                )}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">최소 가격</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={minPrice}
              onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}>
              <option value="">없음</option>
              <option value="10000">1억</option>
              <option value="20000">2억</option>
              <option value="30000">3억</option>
              <option value="40000">4억</option>
              <option value="50000">5억</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">최대 가격</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={maxPrice}
              onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}>
              <option value="">없음</option>
              <option value="20000">2억</option>
              <option value="30000">3억</option>
              <option value="40000">4억</option>
              <option value="50000">5억</option>
              <option value="60000">6억</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">최소 면적(m2)</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={minArea}
              onChange={(e) => { setMinArea(e.target.value); setPage(1); }}>
              <option value="">없음</option>
              <option value="40">40m2 (12평)</option>
              <option value="50">50m2 (15평)</option>
              <option value="60">60m2 (18평)</option>
              <option value="85">85m2 (25평)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">최대 면적(m2)</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={maxArea}
              onChange={(e) => { setMaxArea(e.target.value); setPage(1); }}>
              <option value="">없음</option>
              <option value="60">60m2 (18평)</option>
              <option value="85">85m2 (25평)</option>
              <option value="100">100m2 (30평)</option>
              <option value="135">135m2 (40평)</option>
            </select>
          </div>
        </div>

        {/* 2행: 연식, 방수, 정렬 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">연식 (이후)</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={minYear}
              onChange={(e) => { setMinYear(e.target.value); setPage(1); }}>
              <option value="">전체</option>
              <option value="2020">2020년 이후</option>
              <option value="2015">2015년 이후</option>
              <option value="2010">2010년 이후</option>
              <option value="2005">2005년 이후</option>
              <option value="2000">2000년 이후</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">연식 (이전)</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={maxYear}
              onChange={(e) => { setMaxYear(e.target.value); setPage(1); }}>
              <option value="">전체</option>
              <option value="2000">2000년 이전</option>
              <option value="2005">2005년 이전</option>
              <option value="2010">2010년 이전</option>
              <option value="2015">2015년 이전</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">방 수</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={minRooms}
              onChange={(e) => { setMinRooms(e.target.value); setPage(1); }}>
              <option value="">전체</option>
              <option value="2">2개 이상</option>
              <option value="3">3개 이상</option>
              <option value="4">4개 이상</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">정렬</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm" value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
              <option value="price_number">가격순</option>
              <option value="area">면적순</option>
              <option value="build_year">연식순</option>
              <option value="rooms">방 수순</option>
              <option value="deal_date">거래일순</option>
              <option value="region">지역순</option>
              <option value="title">이름순</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={fetchData} disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400">
              {loading ? "조회 중..." : "조회"}
            </button>
          </div>
        </div>
      </div>

      {/* 결과 상태 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            총 <span className="font-bold text-gray-900">{total}</span>건
          </span>
          <div className="flex gap-1 flex-wrap">
            {sources.map((src) => (
              <span key={src} className={`px-2 py-0.5 rounded text-xs font-medium ${SOURCE_COLORS[src] || "bg-gray-100 text-gray-700"}`}>
                {src}
              </span>
            ))}
          </div>
        </div>
        <button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="text-xs text-gray-500 border rounded px-2 py-1 hover:bg-gray-50">
          {sortOrder === "asc" ? "오름차순 ↑" : "내림차순 ↓"}
        </button>
      </div>

      {/* 테이블 */}
      <PropertyTable items={items} sortBy={sortBy} sortOrder={sortOrder} onSortChange={toggleSort} />

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(1)} disabled={page <= 1}
            className="px-2 py-1.5 border rounded-lg text-sm disabled:text-gray-300 hover:bg-gray-50">처음</button>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:text-gray-300 hover:bg-gray-50">이전</button>
          <span className="text-sm text-gray-600 px-2">{page} / {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:text-gray-300 hover:bg-gray-50">다음</button>
          <button onClick={() => setPage(totalPages)} disabled={page >= totalPages}
            className="px-2 py-1.5 border rounded-lg text-sm disabled:text-gray-300 hover:bg-gray-50">끝</button>
        </div>
      )}
    </div>
  );
}
