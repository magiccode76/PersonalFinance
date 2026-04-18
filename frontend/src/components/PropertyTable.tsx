"use client";

import type { Property } from "@/types/property";

interface Props {
  items: Property[];
  sortBy: string;
  sortOrder: string;
  onSortChange: (field: string) => void;
}

const COLUMNS = [
  { key: "title", label: "매물명", sortable: true },
  { key: "property_type", label: "유형", sortable: false },
  { key: "trade_type", label: "거래", sortable: false },
  { key: "price", label: "가격", sortable: true, sortKey: "price_number" },
  { key: "area", label: "면적(m2)", sortable: true },
  { key: "floor", label: "층", sortable: false },
  { key: "region", label: "지역", sortable: true },
  { key: "source", label: "출처", sortable: false },
];

const SOURCE_COLORS: Record<string, string> = {
  "네이버부동산": "bg-green-100 text-green-700",
  "다방": "bg-blue-100 text-blue-700",
  "부동산114": "bg-orange-100 text-orange-700",
  "카카오맵": "bg-yellow-100 text-yellow-700",
  "부동산빅데이터": "bg-purple-100 text-purple-700",
};

export default function PropertyTable({ items, sortBy, sortOrder, onSortChange }: Props) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
        검색 결과가 없습니다. 검색 조건을 변경해보세요.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">#</th>
              {COLUMNS.map((col) => {
                const sk = col.sortKey || col.key;
                const isActive = sortBy === sk;
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-medium ${
                      col.sortable ? "cursor-pointer hover:text-blue-600" : ""
                    } ${isActive ? "text-blue-600" : "text-gray-500"}`}
                    onClick={() => col.sortable && onSortChange(sk)}
                  >
                    {col.label}
                    {isActive && (sortOrder === "asc" ? " ↑" : " ↓")}
                  </th>
                );
              })}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">링크</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                  {item.title}
                </td>
                <td className="px-4 py-3 text-gray-600">{item.property_type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    item.trade_type === "매매" ? "bg-red-100 text-red-700" :
                    item.trade_type === "전세" ? "bg-blue-100 text-blue-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {item.trade_type}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{item.price}</td>
                <td className="px-4 py-3 text-gray-600">{item.area}</td>
                <td className="px-4 py-3 text-gray-600">{item.floor}</td>
                <td className="px-4 py-3 text-gray-600">{item.region}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    SOURCE_COLORS[item.source] || "bg-gray-100 text-gray-700"
                  }`}>
                    {item.source}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {item.source_url && (
                    <a href={item.source_url} target="_blank" rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-xs">
                      보기
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
