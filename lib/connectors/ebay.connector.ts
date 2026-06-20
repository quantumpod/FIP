import type { ConnectorOrder, ConnectorProduct, SyncResult } from "./types";

const AUTH_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const BASE_URL = "https://api.ebay.com";

async function getEbayToken(appId: string, certId: string, refreshToken: string): Promise<string> {
  const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: "https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly",
    }),
  });
  if (!res.ok) throw new Error(`eBay token error: ${res.status} ${await res.text()}`);
  const { access_token } = await res.json() as { access_token: string };
  return access_token;
}

export async function ebayValidate(appId: string, certId: string, refreshToken: string): Promise<boolean> {
  try {
    await getEbayToken(appId, certId, refreshToken);
    return true;
  } catch {
    return false;
  }
}

export async function ebayFetchOrders(
  appId: string,
  certId: string,
  refreshToken: string
): Promise<ConnectorOrder[]> {
  const token = await getEbayToken(appId, certId, refreshToken);
  const filter = encodeURIComponent(
    `creationdate:[${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}..${new Date().toISOString()}]`
  );
  const res = await fetch(
    `${BASE_URL}/sell/fulfillment/v1/order?filter=${filter}&limit=50`,
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );
  if (!res.ok) throw new Error(`eBay orders error: ${res.status} ${await res.text()}`);
  const data = await res.json() as { orders?: EbayOrder[] };
  return (data.orders ?? []).map(mapOrder);
}

export async function syncEbayOrders(
  appId: string,
  certId: string,
  refreshToken: string,
  importer: (orders: ConnectorOrder[]) => Promise<SyncResult>
): Promise<SyncResult> {
  const orders = await ebayFetchOrders(appId, certId, refreshToken);
  return importer(orders);
}

// eBay doesn't have a simple inventory API on free tier — stub for listings sync
export async function syncEbayListings(
  _appId: string,
  _certId: string,
  _refreshToken: string,
  importer: (products: ConnectorProduct[]) => Promise<SyncResult>
): Promise<SyncResult> {
  return importer([]);
}

// ── eBay API types ────────────────────────────────────────────────────────────

interface EbayOrder {
  orderId: string;
  legacyOrderId?: string;
  fulfillmentStartInstructions?: {
    shippingStep?: { shipTo?: { fullName?: string } };
  }[];
  lineItems?: {
    lineItemId: string;
    sku?: string;
    quantity?: number;
    title?: string;
  }[];
  paymentSummary?: {
    totalDueSeller?: { value?: string };
  };
}

function mapOrder(o: EbayOrder): ConnectorOrder {
  return {
    externalId: o.orderId,
    orderNumber: o.legacyOrderId ?? o.orderId,
    items: (o.lineItems ?? []).map((li) => ({
      sellerSku: li.sku ?? `EBAY-${li.lineItemId}`,
      quantity: li.quantity ?? 1,
      externalId: li.lineItemId,
    })),
  };
}
