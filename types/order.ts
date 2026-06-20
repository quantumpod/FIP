import type { Marketplace } from "@/types/listing";

export type OrderStatus =
  | "NEW"
  | "READY_TO_PICK"
  | "PICKING"
  | "PACKED"
  | "SHIPPED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  listingId: string | null;
  quantity: number;
  product?: {
    id: string;
    masterSku: string;
    name: string;
    status: string;
  };
}

export interface Order {
  id: string;
  companyId: string;
  marketplace: Marketplace;
  externalOrderId: string | null;
  orderNumber: string;
  trackingNumber: string | null;
  carrier: string | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  pickTasks?: { id: string; status: string }[];
}

export interface OrderListResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
