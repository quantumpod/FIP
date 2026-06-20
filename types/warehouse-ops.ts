export type ReceivingStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type PutawayStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type CycleCountStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface ReceivingItem {
  id: string;
  receivingOrderId: string;
  productId: string;
  expectedQty: number;
  receivedQty: number;
  lotNumber: string | null;
  expiresAt: string | null;
  product: { id: string; masterSku: string; name: string; barcode: string | null } | null;
}

export interface ReceivingOrder {
  id: string;
  companyId: string;
  warehouseId: string;
  poNumber: string;
  supplier: string | null;
  status: ReceivingStatus;
  notes: string | null;
  receivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  warehouse: { id: string; name: string; code: string } | null;
  items: ReceivingItem[];
}

export interface PutawayTaskItem {
  id: string;
  putawayTaskId: string;
  productId: string;
  locationId: string;
  quantity: number;
  putawayQty: number;
  product: { id: string; masterSku: string; name: string } | null;
  location: { id: string; code: string } | null;
}

export interface PutawayTask {
  id: string;
  companyId: string;
  receivingOrderId: string | null;
  status: PutawayStatus;
  createdAt: string;
  updatedAt: string;
  receivingOrder: { poNumber: string } | null;
  items: PutawayTaskItem[];
}

export interface CycleCountItem {
  id: string;
  cycleCountId: string;
  locationId: string;
  productId: string;
  systemQty: number;
  countedQty: number | null;
  variance: number | null;
  location: { id: string; code: string } | null;
  product: { id: string; masterSku: string; name: string } | null;
}

export interface CycleCount {
  id: string;
  companyId: string;
  warehouseId: string;
  status: CycleCountStatus;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  warehouse: { id: string; name: string; code: string } | null;
  items: CycleCountItem[];
}

export interface PalletItem {
  id: string;
  palletId: string;
  productId: string;
  quantity: number;
  lotNumber: string | null;
  product: { id: string; masterSku: string; name: string } | null;
}

export interface Pallet {
  id: string;
  companyId: string;
  warehouseId: string;
  code: string;
  locationId: string | null;
  isSealed: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  warehouse: { id: string; name: string; code: string } | null;
  location: { id: string; code: string } | null;
  items: PalletItem[];
}
