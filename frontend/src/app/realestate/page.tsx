"use client";

import { useProperties } from "@/hooks/useProperties";
import SearchFilter from "@/components/SearchFilter";
import PropertyTable from "@/components/PropertyTable";
import ExportButton from "@/components/ExportButton";

export default function RealEstatePage() {
  const { params, setParams, items, total, loading, error, apiStatus, search, save, toggleSort } =
    useProperties();

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

      <SearchFilter
        params={params}
        onChange={setParams}
        onSearch={search}
        loading={loading}
      />

      {/* API 상태 표시 (에러 시) */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-red-800 font-medium text-sm">크롤링 실패</span>
                {apiStatus.statusCode > 0 && (
                  <span className="text-red-500 text-xs bg-red-100 px-2 py-0.5 rounded">
                    HTTP {apiStatus.statusCode}
                  </span>
                )}
              </div>
              <p className="text-red-700 text-sm">{error}</p>
              {apiStatus.sourceUrl && (
                <p className="text-red-400 text-xs mt-1 truncate">
                  요청 URL: {apiStatus.sourceUrl}
                </p>
              )}
            </div>
            <button
              onClick={search}
              disabled={loading}
              className="ml-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition disabled:bg-gray-400 whitespace-nowrap"
            >
              {loading ? "재시도 중..." : "재시도"}
            </button>
          </div>
        </div>
      )}

      {/* 성공 상태 + 건수 */}
      {apiStatus.success && total > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-green-800 text-sm">
              크롤링 성공 - 총 <span className="font-bold">{total}</span>건 검색됨
            </span>
            {apiStatus.statusCode > 0 && (
              <span className="text-green-600 text-xs bg-green-100 px-2 py-0.5 rounded">
                HTTP {apiStatus.statusCode}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 성공했지만 결과 0건 */}
      {apiStatus.success && total === 0 && apiStatus.statusCode > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-yellow-500"></span>
                <span className="text-yellow-800 font-medium text-sm">검색 결과 없음</span>
              </div>
              <p className="text-yellow-700 text-sm">
                {apiStatus.errorMessage || "해당 조건에 맞는 매물이 없습니다. 검색 조건을 변경해보세요."}
              </p>
            </div>
            <button
              onClick={search}
              disabled={loading}
              className="ml-4 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition disabled:bg-gray-400 whitespace-nowrap"
            >
              다시 검색
            </button>
          </div>
        </div>
      )}

      <PropertyTable
        items={items}
        sortBy={params.sort_by}
        sortOrder={params.sort_order}
        onSortChange={toggleSort}
      />
    </div>
  );
}
