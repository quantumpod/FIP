export interface PackagingRule {
  id: string;
  companyId: string;
  productId: string | null;
  name: string;
  boxCode: string;
  minQty: number | null;
  maxQty: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  weightLimit: number | null;
  createdAt: string;
  updatedAt: string;
  product?: { id: string; masterSku: string; name: string } | null;
}

export interface PackagingListResponse {
  data: PackagingRule[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PackagingRecommendation {
  rule: PackagingRule;
  quantity: number;
}
