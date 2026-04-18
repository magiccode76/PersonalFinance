import axios from "axios";
import type { SearchParams, SearchResponse, ListResponse } from "@/types/property";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

export async function searchProperties(params: SearchParams): Promise<SearchResponse> {
  const { data } = await api.get("/api/realestate/search", { params });
  return data;
}

export async function fetchAllRegions(): Promise<Record<string, string[]>> {
  const { data } = await api.get("/api/realestate/regions-all");
  return data;
}

export async function listProperties(params: Partial<SearchParams> & {
  page_size?: number;
  min_price?: number;
  max_price?: number;
}): Promise<ListResponse> {
  const { data } = await api.get("/api/realestate/list", { params });
  return data;
}

export async function saveProperties(properties: unknown[]): Promise<{ inserted: number }> {
  const { data } = await api.post("/api/realestate/save", properties);
  return data;
}

export async function deleteProperty(id: string): Promise<void> {
  await api.delete(`/api/realestate/${id}`);
}

export function getExportUrl(params: {
  format: string;
  sort_by?: string;
  sort_order?: string;
  region?: string;
  property_type?: string;
  trade_type?: string;
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v != null) as [string, string][]
  ).toString();
  return `${baseUrl}/api/export/download?${query}`;
}
