export type PickTaskStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export interface PickTaskItem {
  id: string;
  pickTaskId: string;
  productId: string;
  locationId: string;
  quantity: number;
  pickedQty: number;
  product?: { id: string; masterSku: string; name: string };
  location?: { id: string; code: string };
}

export interface PickTask {
  id: string;
  orderId: string;
  status: PickTaskStatus;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    marketplace: string;
    trackingNumber: string | null;
    status: string;
  };
  items?: PickTaskItem[];
}

export interface PickTaskListResponse {
  data: PickTask[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
