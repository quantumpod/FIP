export interface SyncResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface ConnectorOrder {
  externalId: string;
  orderNumber: string;
  trackingNumber?: string;
  carrier?: string;
  items: ConnectorOrderItem[];
}

export interface ConnectorOrderItem {
  sellerSku: string;
  quantity: number;
  externalId?: string;
}

export interface ConnectorProduct {
  externalId: string;
  sku: string;
  name: string;
  quantity: number;
}
