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
    `${BASE_URL}/orders?status=allocated&page_size=50&page=${page}`,
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
  const res = await fetch(`${BASE_URL}/company`, { headers: headers(apiKey) });
  return res.ok;
}

// ── Result builders (used by dispatcher) ──────────────────────────────────────

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
  shipments?: { tracking_number?: string; carrier?: string }[];
  line_items?: VeeqoLineItem[];
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

function mapOrder(o: VeeqoOrder): ConnectorOrder {
  const shipment = o.shipments?.[0];
  return {
    externalId: String(o.id),
    orderNumber: o.number ?? `VEEQO-${o.id}`,
    trackingNumber: shipment?.tracking_number ?? undefined,
    carrier: shipment?.carrier ?? undefined,
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
