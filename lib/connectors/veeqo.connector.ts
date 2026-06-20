import type { ConnectorOrder, ConnectorProduct, SyncResult } from "./types";

const BASE_URL = "https://api.veeqo.com";

function headers(apiKey: string) {
  return {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };
}

export async function veeqoFetchOrders(apiKey: string, page = 1): Promise<ConnectorOrder[]> {
  const res = await fetch(
    `${BASE_URL}/orders?page_size=50&page=${page}`,
    { headers: headers(apiKey) }
  );
  if (!res.ok) throw new Error(`Veeqo orders error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return (data as VeeqoOrder[]).map(mapOrder);
}

export async function veeqoFetchProducts(apiKey: string, page = 1): Promise<ConnectorProduct[]> {
  const res = await fetch(
    `${BASE_URL}/products?page_size=50&page=${page}`,
    { headers: headers(apiKey) }
  );
  if (!res.ok) throw new Error(`Veeqo products error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return (data as VeeqoProduct[]).flatMap(mapProduct);
}

export async function veeqoValidate(apiKey: string): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/orders?page_size=1`, { headers: headers(apiKey) });
  return res.ok;
}

export async function syncVeeqoOrders(
  apiKey: string,
  importer: (orders: ConnectorOrder[]) => Promise<SyncResult>
): Promise<SyncResult> {
  const orders = await veeqoFetchOrders(apiKey);
  return importer(orders);
}

export async function syncVeeqoInventory(
  apiKey: string,
  importer: (products: ConnectorProduct[]) => Promise<SyncResult>
): Promise<SyncResult> {
  const products = await veeqoFetchProducts(apiKey);
  return importer(products);
}

// ── Veeqo API types ───────────────────────────────────────────────────────────

interface VeeqoOrder {
  id: number;
  number: string;
  allocations?: VeeqoAllocation[];
  line_items?: VeeqoLineItem[];
}

interface VeeqoAllocation {
  shipment?: {
    tracking_number?: { tracking_number?: string } | string;
    service_carrier_name?: string;
    short_service_name?: string;
  };
}

interface VeeqoLineItem {
  id: number;
  sellable?: { sku_code?: string };
  quantity: number;
}

interface VeeqoProduct {
  id: number;
  title: string;
  variants?: VeeqoVariant[];
}

interface VeeqoVariant {
  id: number;
  sku_code?: string;
  inventory_entries?: { physical_count_on_hand?: number }[];
}

function extractTracking(alloc?: VeeqoAllocation): { tracking?: string; carrier?: string } {
  if (!alloc?.shipment) return {};
  const ship = alloc.shipment;
  const tn = ship.tracking_number;
  const tracking = typeof tn === "object" ? tn?.tracking_number : tn;
  const carrier = ship.service_carrier_name ?? ship.short_service_name;
  return { tracking: tracking ?? undefined, carrier: carrier ?? undefined };
}

function mapOrder(o: VeeqoOrder): ConnectorOrder {
  const { tracking, carrier } = extractTracking(o.allocations?.[0]);
  return {
    externalId: String(o.id),
    orderNumber: o.number ?? `VEEQO-${o.id}`,
    trackingNumber: tracking,
    carrier,
    items: (o.line_items ?? []).map((li) => ({
      sellerSku: li.sellable?.sku_code ?? `VEEQO-ITEM-${li.id}`,
      quantity: li.quantity,
      externalId: String(li.id),
    })),
  };
}

function mapProduct(p: VeeqoProduct): ConnectorProduct[] {
  return (p.variants ?? []).map((v) => ({
    externalId: String(v.id),
    sku: v.sku_code ?? `VEEQO-${v.id}`,
    name: p.title,
    quantity: v.inventory_entries?.[0]?.physical_count_on_hand ?? 0,
  }));
}
