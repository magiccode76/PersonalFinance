"use client";

import { useState, useCallback } from "react";
import type { Property, SearchParams } from "@/types/property";
import { searchProperties, saveProperties } from "@/lib/api";

const DEFAULT_PARAMS: SearchParams = {
  sido: "서울특별시",
  sigungu: "강남구",
  property_type: "아파트",
  trade_type: "매매",
  sort_by: "price_number",
  sort_order: "asc",
  page: 1,
};

export interface ApiStatus {
  success: boolean;
  statusCode: number;
  errorMessage: string;
  sourceUrl: string;
}

const INITIAL_STATUS: ApiStatus = {
  success: true,
  statusCode: 0,
  errorMessage: "",
  sourceUrl: "",
};

export function useProperties() {
  const [params, setParams] = useState<SearchParams>(DEFAULT_PARAMS);
  const [items, setItems] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>(INITIAL_STATUS);

  const search = useCallback(async () => {
    setLoading(true);
    setError(null);
    setApiStatus(INITIAL_STATUS);
    try {
      const data = await searchProperties(params);
      setItems(data.items);
      setTotal(data.total);
      setApiStatus({
        success: data.success,
        statusCode: data.status_code,
        errorMessage: data.error_message,
        sourceUrl: data.source_url,
      });
      if (!data.success) {
        setError(data.error_message || "크롤링에 실패했습니다.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message.includes("Network Error")
          ? "서버에 연결할 수 없습니다. 서버 상태를 확인해주세요."
          : "검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      setError(message);
      setApiStatus({
        success: false,
        statusCode: 0,
        errorMessage: message,
        sourceUrl: "",
      });
    } finally {
      setLoading(false);
    }
  }, [params]);

  const save = useCallback(async () => {
    if (items.length === 0) return;
    try {
      const result = await saveProperties(items);
      alert(`${result.inserted}건이 저장되었습니다.`);
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    }
  }, [items]);

  const toggleSort = useCallback((field: string) => {
    setParams((prev) => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === "asc" ? "desc" : "asc",
    }));
  }, []);

  return { params, setParams, items, total, loading, error, apiStatus, search, save, toggleSort };
}
