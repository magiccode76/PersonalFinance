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
const SOURCE_OPTIONS = [
  { key: "naver", label: "네이버부동산", color: "bg-green-500" },
  { key: "dabang", label: "다방", color: "bg-blue-500" },
  { key: "r114", label: "부동산114", color: "bg-orange-500" },
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
      .catch(() => setRegions({ "서울특별시": ["강남구", "서초구", "송파구"] }))
      .finally(() => setLoadingRegions(false));
  }, []);

  const sidoList = Object.keys(regions);
  const sigunguList = regions[params.sido] || [];
  const selectedSources = params.sources.split(",").filter(Boolean);

  const update = (key: keyof SearchParams, value: string | number) => {
    if (key === "sido") {
      const newSigunguList = regions[value as string] || [];
      onChange({ ...params, sido: value as string, sigungu: newSigunguList[0] || "" });
    } else {
      onChange({ ...params, [key]: value });
    }
  };

  const toggleSource = (sourceKey: string) => {
    const current = new Set(selectedSources);
    if (current.has(sourceKey)) {
      current.delete(sourceKey);
    } else {
      current.add(sourceKey);
    }
    if (current.size === 0) return; // 최소 1개
    onChange({ ...params, sources: Array.from(current).join(",") });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 space-y-4">
      {/* 출처 선택 */}
      <div>
        <label className="block text-xs text-gray-500 mb-2">검색 출처</label>
        <div className="flex gap-2 flex-wrap">
          {SOURCE_OPTIONS.map((src) => {
            const active = selectedSources.includes(src.key);
            return (
              <button
                key={src.key}
                onClick={() => toggleSource(src.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                  active
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${active ? src.color : "bg-gray-300"}`}></span>
                {src.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 검색 조건 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">시/도</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={params.sido}
            onChange={(e) => update("sido", e.target.value)} disabled={loadingRegions}>
            {loadingRegions ? <option>로딩 중...</option> : sidoList.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">시/군/구</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={params.sigungu}
            onChange={(e) => update("sigungu", e.target.value)}>
            {sigunguList.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">매물유형</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={params.property_type}
            onChange={(e) => update("property_type", e.target.value)}>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">거래유형</label>
          <select className="w-full border rounded-lg px-3 py-2 text-sm" value={params.trade_type}
            onChange={(e) => update("trade_type", e.target.value)}>
            {TRADE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">정렬</label>
          <div className="flex gap-1">
            <select className="flex-1 border rounded-lg px-3 py-2 text-sm" value={params.sort_by}
              onChange={(e) => update("sort_by", e.target.value)}>
              {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <button className="border rounded-lg px-2 py-2 text-sm hover:bg-gray-50"
              onClick={() => update("sort_order", params.sort_order === "asc" ? "desc" : "asc")}
              title="정렬 방향 전환">
              {params.sort_order === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>
        <div className="flex items-end">
          <button
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400"
            onClick={onSearch} disabled={loading}>
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>
      </div>
    </div>
  );
}
