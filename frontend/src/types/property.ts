export interface Property {
  id?: string;
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
  image_url: string;
  created_at?: string;
  updated_at?: string;
}

export interface SearchParams {
  sido: string;
  sigungu: string;
  property_type: string;
  trade_type: string;
  sources: string;
  sort_by: string;
  sort_order: string;
  page: number;
}

export interface SourceResult {
  source_name: string;
  success: boolean;
  status_code: number;
  error_message: string;
  total: number;
}

export interface SearchResponse {
  success: boolean;
  source_results: SourceResult[];
  error_message: string;
  total: number;
  page: number;
  sort_by: string;
  sort_order: string;
  items: Property[];
}

export interface ListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  sort_by: string;
  sort_order: string;
  items: Property[];
}
