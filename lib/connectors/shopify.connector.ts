import type { ConnectorOrder, ConnectorProduct, SyncResult } from "./types";

function base(shopUrl: string) {
  const host = shopUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${host}/admin/api/2024-01`;
}

function headers(accessToken: string) {
  return {
    "X-Shopify-Access-Token": accessToken,
    "Content-Type": "application/json",
  };
}

export async function shopifyValidate(shopUrl: string, accessToken: string): Promise<boolean> {
  const res = await fetch(`${base(shopUrl)}/shop.json`, { headers: headers(accessToken) });
  return res.ok;
}

export async function shopifyFetchOrders(shopUrl: string, accessToken: string): Promise<ConnectorOrder[]> {
  const res = await fetch(
    `${base(shopUrl)}/orders.json?status=open&limit=50`,
    { headers: headers(accessToken) }
  );
  if (!res.ok) throw new Error(`Shopify orders error: ${res.status} ${await res.text()}`);
  const { orders } = await res.json() as { orders: ShopifyOrder[] };
  return orders.map(mapOrder);
}

export async function shopifyFetchProducts(shopUrl: string, accessToken: string): Promise<ConnectorProduct[]> {
  const res = await fetch(
    `${base(shopUrl)}/products.json?limit=50`,
    { headers: headers(accessToken) }
  );
  if (!res.ok) throw new Error(`Shopify products error: ${res.status} ${await res.text()}`);
  const { products } = await res.json() as { products: ShopifyProduct[] };
  return products.flatMap(mapProduct);
}

export async function syncShopifyOrders(
  shopUrl: string,
  accessToken: string,
  importer: (orders: ConnectorOrder[]) => Promise<SyncResult>
): Promise<SyncResult> {
  const orders = await shopifyFetchOrders(shopUrl, accessToken);
  return importer(orders);
}

export async function syncShopifyInventory(
  shopUrl: string,
  accessToken: string,
  importer: (products: ConnectorProduct[]) => Promise<SyncResult>
): Promise<SyncResult> {
  const products = await shopifyFetchProducts(shopUrl, accessToken);
  return importer(products);
}

// ── Shopify API types ─────────────────────────────────────────────────────────

interface ShopifyOrder {
  id: number;
  name: string;
  fulfillments?: { tracking_number?: string; tracking_company?: string }[];
  line_items?: { id: number; sku?: string; quantity: number }[];
}

interface ShopifyProduct {
  id: number;
  title: string;
  variants?: { id: number; sku?: string; inventory_quantity?: number }[];
}

function mapOrder(o: ShopifyOrder): ConnectorOrder {
  const f = o.fulfillments?.[0];
  return {
    externalId: String(o.id),
    orderNumber: o.name,
    trackingNumber: f?.tracking_number ?? undefined,
    carrier: f?.tracking_company ?? undefined,
    items: (o.line_items ?? []).map((li) => ({
      sellerSku: li.sku ?? `SHP-${li.id}`,
      quantity: li.quantity,
      externalId: String(li.id),
    })),
  };
}

function mapProduct(p: ShopifyProduct): ConnectorProduct[] {
  return (p.variants ?? []).map((v) => ({
    externalId: String(v.id),
    sku: v.sku ?? `SHP-${v.id}`,
    name: p.title,
    quantity: v.inventory_quantity ?? 0,
  }));
}
