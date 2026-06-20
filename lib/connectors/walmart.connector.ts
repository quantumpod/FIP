import type { ConnectorOrder, ConnectorProduct, SyncResult } from "./types";

const BASE_URL = "https://marketplace.walmartapis.com/v3";

async function getWalmartToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${BASE_URL}/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "WM_SVC.NAME": "Walmart Marketplace",
      "WM_QOS.CORRELATION_ID": crypto.randomUUID(),
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Walmart token error: ${res.status} ${await res.text()}`);
  const { access_token } = await res.json() as { access_token: string };
  return access_token;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "WM_SVC.NAME": "Walmart Marketplace",
    "WM_QOS.CORRELATION_ID": crypto.randomUUID(),
  };
}

export async function walmartValidate(clientId: string, clientSecret: string): Promise<boolean> {
  try {
    await getWalmartToken(clientId, clientSecret);
    return true;
  } catch {
    return false;
  }
}

export async function walmartFetchOrders(clientId: string, clientSecret: string): Promise<ConnectorOrder[]> {
  const token = await getWalmartToken(clientId, clientSecret);
  const createdStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `${BASE_URL}/orders?createdStartDate=${createdStartDate}&status=Created&limit=50`,
    { headers: authHeaders(token) }
  );
  if (!res.ok) throw new Error(`Walmart orders error: ${res.status} ${await res.text()}`);
  const data = await res.json() as WalmartOrdersResponse;
  return (data.list?.elements?.order ?? []).map(mapOrder);
}

export async function walmartFetchInventory(clientId: string, clientSecret: string): Promise<ConnectorProduct[]> {
  const token = await getWalmartToken(clientId, clientSecret);
  const res = await fetch(`${BASE_URL}/inventory?limit=50`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error(`Walmart inventory error: ${res.status}`);
  const data = await res.json() as { inventory?: { sku?: string; quantity?: { amount?: number } }[] };
  return (data.inventory ?? []).map((i) => ({
    externalId: i.sku ?? "",
    sku: i.sku ?? "",
    name: i.sku ?? "",
    quantity: i.quantity?.amount ?? 0,
  }));
}

export async function syncWalmartOrders(
  clientId: string,
  clientSecret: string,
  importer: (orders: ConnectorOrder[]) => Promise<SyncResult>
): Promise<SyncResult> {
  const orders = await walmartFetchOrders(clientId, clientSecret);
  return importer(orders);
}

export async function syncWalmartInventory(
  clientId: string,
  clientSecret: string,
  importer: (products: ConnectorProduct[]) => Promise<SyncResult>
): Promise<SyncResult> {
  const products = await walmartFetchInventory(clientId, clientSecret);
  return importer(products);
}

// ── Walmart API types ─────────────────────────────────────────────────────────

interface WalmartOrdersResponse {
  list?: {
    elements?: {
      order?: WalmartOrder[];
    };
  };
}

interface WalmartOrder {
  purchaseOrderId: string;
  customerOrderId?: string;
  orderLines?: {
    orderLine?: {
      item?: { sku?: string };
      orderLineQuantity?: { amount?: number };
      trackingInfo?: { trackingNumber?: string; carrierName?: { carrier?: string } }[];
    }[];
  };
}

function mapOrder(o: WalmartOrder): ConnectorOrder {
  const lines = o.orderLines?.orderLine ?? [];
  const tracking = lines[0]?.trackingInfo?.[0];
  return {
    externalId: o.purchaseOrderId,
    orderNumber: o.customerOrderId ?? o.purchaseOrderId,
    trackingNumber: tracking?.trackingNumber ?? undefined,
    carrier: tracking?.carrierName?.carrier ?? undefined,
    items: lines.map((li) => ({
      sellerSku: li.item?.sku ?? `WMT-ITEM`,
      quantity: li.orderLineQuantity?.amount ?? 1,
    })),
  };
}
