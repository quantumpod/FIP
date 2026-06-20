export interface Location {
  id: string;
  warehouseId: string;
  code: string;
  zone: string | null;
  aisle: string | null;
  rack: string | null;
  bin: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  warehouse?: { id: string; name: string; code: string };
  inventoryItems?: InventoryItem[];
}

export interface InventoryItem {
  id: string;
  productId: string;
  locationId: string;
  onHand: number;
  allocated: number;
  available: number;
  lotNumber: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  product?: { id: string; masterSku: string; name: string; status: string };
  location?: Location;
}

export interface LocationListResponse {
  data: Location[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InventoryListResponse {
  data: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
