export type Marketplace = "AMAZON" | "WALMART" | "EBAY" | "SHOPIFY" | "VEEQO" | "MANUAL";

export interface Listing {
  id: string;
  companyId: string;
  productId: string;
  marketplace: Marketplace;
  sellerSku: string;
  asin: string | null;
  fnsku: string | null;
  externalId: string | null;
  bundleQty: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    masterSku: string;
    name: string;
    status: string;
  };
}

export interface ListingListResponse {
  data: Listing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
