export type ProductStatus = "ACTIVE" | "INACTIVE" | "DRAFT";

export interface Product {
  id: string;
  masterSku: string;
  name: string;
  description: string | null;
  barcode: string | null;
  upc: string | null;
  brand: string | null;
  status: ProductStatus;
  length: number | null;
  width: number | null;
  height: number | null;
  weight: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
