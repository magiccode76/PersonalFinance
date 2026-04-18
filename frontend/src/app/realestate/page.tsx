"use client";

import { useState } from "react";
import { useProperties } from "@/hooks/useProperties";
import SearchFilter from "@/components/SearchFilter";
import PropertyTable from "@/components/PropertyTable";
import ExportButton from "@/components/ExportButton";
import SavedProperties from "@/components/SavedProperties";

const SOURCE_DOT_COLORS: Record<string, string> = {
  "네이버부동산": "bg-green-500",
  "다방": "bg-blue-500",
  "부동산114": "bg-orange-500",
  "카카오맵": "bg-yellow-500",
  "부동산빅데이터": "bg-purple-500",
  "공공데이터(실거래가 기반)": "bg-red-500",
  "국토교통부 실거래가": "bg-red-500",
};

export default function RealEstatePage() {
  const [tab, setTab] = useState<"search" | "saved">("saved");
  const { params, setParams, items, total, loading, error, sourceResults, search, save, toggleSort } =
    useProperties();

  const hasSearched = sourceResults.length > 0;

  return (
    <div className="space-y-4">
      {/* 탭 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab("saved")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === "saved" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            저장된 매물
          </button>
          <button
            onClick={() => setTab("search")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              tab === "search" ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            실시간 검색
          </button>
        </div>
        {tab === "search" && (
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button onClick={save}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                결과 저장
              </button>
            )}
            <ExportButton params={params} hasData={items.length > 0} />
          </div>
        )}
      </div>

      {/* 저장된 매물 탭 */}
      {tab === "saved" && <SavedProperties />}

      {/* 실시간 검색 탭 */}
      {tab === "search" && (
        <>
          <SearchFilter params={params} onChange={setParams} onSearch={search} loading={loading} />

          {hasSearched && (
            <div className="bg-white rounded-xl shadow-sm border p-3">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs font-medium text-gray-500">출처별 크롤링 결과</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {sourceResults.map((sr) => (
                  <div key={sr.source_name}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${
                      sr.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
                    }`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      sr.success ? SOURCE_DOT_COLORS[sr.source_name] || "bg-green-500" : "bg-red-500"
                    }`}></span>
                    <span className="font-medium">{sr.source_name}</span>
                    {sr.success ? <span>{sr.total}건</span> : <span className="text-red-600">{sr.error_message || "실패"}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && !sourceResults.some((r) => r.success) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start justify-between">
              <div className="flex-1">
                <p className="text-red-800 font-medium text-sm mb-1">모든 출처에서 크롤링 실패</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button onClick={search} disabled={loading}
                className="ml-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:bg-gray-400 whitespace-nowrap">
                {loading ? "재시도 중..." : "재시도"}
              </button>
            </div>
          )}

          {hasSearched && total > 0 && (
            <div className="text-sm text-gray-500">
              총 <span className="font-medium text-gray-900">{total}</span>건의 매물이 검색되었습니다.
            </div>
          )}

          <PropertyTable items={items} sortBy={params.sort_by} sortOrder={params.sort_order} onSortChange={toggleSort} />
        </>
      )}
    </div>
  );
}
