"use client";

import { getExportUrl } from "@/lib/api";
import type { SearchParams } from "@/types/property";

interface Props {
  params: SearchParams;
  hasData: boolean;
}

export default function ExportButton({ params, hasData }: Props) {
  if (!hasData) return null;

  const downloadFile = (format: string) => {
    const url = getExportUrl({
      format,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
      region: `${params.sido} ${params.sigungu}`,
      property_type: params.property_type,
      trade_type: params.trade_type,
    });
    window.open(url, "_blank");
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => downloadFile("xlsx")}
        className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
      >
        Excel 다운로드
      </button>
      <button
        onClick={() => downloadFile("csv")}
        className="flex items-center gap-1 bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
      >
        CSV 다운로드
      </button>
    </div>
  );
}
