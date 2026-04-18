import axios from "axios";

const API_URL = "http://10.0.2.2:8000"; // Android 에뮬레이터에서 localhost 접근

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

export interface Property {
  title: string;
  property_type: string;
  trade_type: string;
  price: string;
  price_number: number;
  area: number;
  floor: string;
  address: string;
  region: string;
  description: string;
  source: string;
  source_url: string;
}

export interface SearchParams {
  sido: string;
  sigungu: string;
  property_type: string;
  trade_type: string;
  sort_by: string;
  sort_order: string;
  page: number;
}

export async function fetchAllRegions(): Promise<Record<string, string[]>> {
  const { data } = await api.get("/api/realestate/regions-all");
  return data;
}

export async function searchProperties(params: SearchParams) {
  const { data } = await api.get("/api/realestate/search", { params });
  return data;
}

export async function saveProperties(properties: Property[]) {
  const { data } = await api.post("/api/realestate/save", properties);
  return data;
}

export default api;
