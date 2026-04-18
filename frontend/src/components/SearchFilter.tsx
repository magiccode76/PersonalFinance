"use client";

import { useState, useEffect } from "react";
import type { SearchParams } from "@/types/property";
import { fetchAllRegions } from "@/lib/api";

const PROPERTY_TYPES = ["아파트", "오피스텔", "빌라", "원룸", "상가"];
const TRADE_TYPES = ["매매", "전세", "월세"];
const SORT_OPTIONS = [
  { value: "price_number", label: "가격순" },
  { value: "area", label: "면적순" },
  { value: "title", label: "이름순" },
];

interface Props {
  params: SearchParams;
  onChange: (params: SearchParams) => void;
  onSearch: () => void;
  loading: boolean;
}

export default function SearchFilter({ params, onChange, onSearch, loading }: Props) {
  const [regions, setRegions] = useState<Record<string, string[]>>({});
  const [loadingRegions, setLoadingRegions] = useState(true);

  useEffect(() => {
    fetchAllRegions()
      .then(setRegions)
      .catch(() => {
        // API 실패 시 기본 데이터
        setRegions({ "서울특별시": ["강남구", "서초구", "송파구"] });
      })
      .finally(() => setLoadingRegions(false));
  }, []);

  const sidoList = Object.keys(regions);
  const sigunguList = regions[params.sido] || [];

  const update = (key: keyof SearchParams, value: string | number) => {
    if (key === "sido") {
      const newSigunguList = regions[value as string] || [];
      onChange({
        ...params,
        sido: value as string,
        sigungu: newSigunguList[0] || "",
      });
    } else {
      onChange({ ...params, [key]: value });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 시/도 선택 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">시/도</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={params.sido}
            onChange={(e) => update("sido", e.target.value)}
            disabled={loadingRegions}
          >
            {loadingRegions ? (
              <option>로딩 중...</option>
            ) : (
              sidoList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))
            )}
          </select>
        </div>
        {/* 시/군/구 선택 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">시/군/구</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={params.sigungu}
            onChange={(e) => update("sigungu", e.target.value)}
          >
            {sigunguList.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        {/* 매물유형 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">매물유형</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={params.property_type}
            onChange={(e) => update("property_type", e.target.value)}
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        {/* 거래유형 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">거래유형</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm"
            value={params.trade_type}
            onChange={(e) => update("trade_type", e.target.value)}
          >
            {TRADE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        {/* 정렬 */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">정렬</label>
          <div className="flex gap-1">
            <select
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              value={params.sort_by}
              onChange={(e) => update("sort_by", e.target.value)}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button
              className="border rounded-lg px-2 py-2 text-sm hover:bg-gray-50"
              onClick={() => update("sort_order", params.sort_order === "asc" ? "desc" : "asc")}
              title="정렬 방향 전환"
            >
              {params.sort_order === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
        {/* 검색 버튼 */}
        <div className="flex items-end">
          <button
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
            onClick={onSearch}
            disabled={loading}
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>
      </div>
    </div>
  );
}
