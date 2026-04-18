"use client";

import { useProperties } from "@/hooks/useProperties";
import SearchFilter from "@/components/SearchFilter";
import PropertyTable from "@/components/PropertyTable";
import ExportButton from "@/components/ExportButton";

const SOURCE_DOT_COLORS: Record<string, string> = {
  "네이버부동산": "bg-green-500",
  "다방": "bg-blue-500",
  "부동산114": "bg-orange-500",
};

export default function RealEstatePage() {
  const { params, setParams, items, total, loading, error, sourceResults, search, save, toggleSort } =
    useProperties();

  const hasSearched = sourceResults.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">부동산 매물 검색</h2>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={save}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
            >
              결과 저장
            </button>
          )}
          <ExportButton params={params} hasData={items.length > 0} />
        </div>
      </div>

      <SearchFilter params={params} onChange={setParams} onSearch={search} loading={loading} />

      {/* 출처별 크롤링 상태 */}
      {hasSearched && (
        <div className="bg-white rounded-xl shadow-sm border p-3">
          <div className="flex items-center gap-1 mb-2">
            <span className="text-xs font-medium text-gray-500">출처별 크롤링 결과</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sourceResults.map((sr) => (
              <div
                key={sr.source_name}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border ${
                  sr.success
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${
                  sr.success
                    ? SOURCE_DOT_COLORS[sr.source_name] || "bg-green-500"
                    : "bg-red-500"
                }`}></span>
                <span className="font-medium">{sr.source_name}</span>
                {sr.success ? (
                  <span>{sr.total}건</span>
                ) : (
                  <span className="text-red-600">{sr.error_message || "실패"}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 전체 실패 시 재시도 */}
      {error && !sourceResults.some((r) => r.success) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-red-800 font-medium text-sm mb-1">모든 출처에서 크롤링 실패</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button
              onClick={search} disabled={loading}
              className="ml-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:bg-gray-400 whitespace-nowrap"
            >
              {loading ? "재시도 중..." : "재시도"}
            </button>
          </div>
        </div>
      )}

      {/* 성공 + 건수 */}
      {hasSearched && total > 0 && (
        <div className="text-sm text-gray-500">
          총 <span className="font-medium text-gray-900">{total}</span>건의 매물이 검색되었습니다.
        </div>
      )}

      {/* 성공했지만 0건 */}
      {hasSearched && total === 0 && sourceResults.some((r) => r.success) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-yellow-700 text-sm">해당 조건에 맞는 매물이 없습니다. 검색 조건을 변경해보세요.</p>
          <button onClick={search} disabled={loading}
            className="ml-4 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition disabled:bg-gray-400 whitespace-nowrap">
            다시 검색
          </button>
        </div>
      )}

      <PropertyTable items={items} sortBy={params.sort_by} sortOrder={params.sort_order} onSortChange={toggleSort} />
    </div>
  );
}
