import type { ConnectorOrder, ConnectorProduct, SyncResult } from "./types";

// Amazon SP-API — uses LWA (Login with Amazon) for auth
const LWA_URL = "https://api.amazon.com/auth/o2/token";

interface AmazonCreds {
  sellerId: string;
  clientId: string;     // LWA Client ID (stored as accessKeyId)
  clientSecret: string; // LWA Client Secret (stored as secretKey)
  refreshToken: string;
  region: string;       // e.g. us-east-1
}

function endpoint(region: string) {
  const map: Record<string, string> = {
    "us-east-1": "https://sellingpartnerapi-na.amazon.com",
    "eu-west-1": "https://sellingpartnerapi-eu.amazon.com",
    "us-west-2": "https://sellingpartnerapi-fe.amazon.com",
  };
  return map[region] ?? "https://sellingpartnerapi-na.amazon.com";
}

async function getLwaToken(creds: AmazonCreds): Promise<string> {
  const res = await fetch(LWA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Amazon LWA token error: ${res.status} ${await res.text()}`);
  const { access_token } = await res.json() as { access_token: string };
  return access_token;
}

export async function amazonValidate(creds: AmazonCreds): Promise<boolean> {
  try {
    await getLwaToken(creds);
    return true;
  } catch {
    return false;
  }
}

export async function amazonFetchOrders(creds: AmazonCreds): Promise<ConnectorOrder[]> {
  const token = await getLwaToken(creds);
  const base = endpoint(creds.region);
  // Fetch orders created in last 7 days
  const createdAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `${base}/orders/v0/orders?MarketplaceIds=ATVPDKIKX0DER&CreatedAfter=${createdAfter}&OrderStatuses=Unshipped,PartiallyShipped`,
    { headers: { "x-amz-access-token": token, "Content-Type": "application/json" } }
  );
  if (!res.ok) throw new Error(`Amazon orders error: ${res.status} ${await res.text()}`);
  const { payload } = await res.json() as { payload: { Orders: AmazonOrder[] } };
  const orders = payload?.Orders ?? [];

  return Promise.all(
    orders.map(async (o) => {
      const items = await amazonFetchOrderItems(creds, token, o.AmazonOrderId);
      return { ...mapOrder(o), items };
    })
  );
}

async function amazonFetchOrderItems(
  creds: AmazonCreds,
  token: string,
  orderId: string
): Promise<ConnectorOrder["items"]> {
  const base = endpoint(creds.region);
  const res = await fetch(`${base}/orders/v0/orders/${orderId}/orderItems`, {
    headers: { "x-amz-access-token": token },
  });
  if (!res.ok) return [];
  const { payload } = await res.json() as { payload: { OrderItems: AmazonOrderItem[] } };
  return (payload?.OrderItems ?? []).map((li) => ({
    sellerSku: li.SellerSKU ?? `AMZ-${li.OrderItemId}`,
    quantity: li.QuantityOrdered ?? 1,
    externalId: li.OrderItemId,
  }));
}

export async function syncAmazonOrders(
  creds: AmazonCreds,
  importer: (orders: ConnectorOrder[]) => Promise<SyncResult>
): Promise<SyncResult> {
  const orders = await amazonFetchOrders(creds);
  return importer(orders);
}

export async function syncAmazonListings(
  creds: AmazonCreds,
  importer: (products: ConnectorProduct[]) => Promise<SyncResult>
): Promise<SyncResult> {
  const token = await getLwaToken(creds);
  const base = endpoint(creds.region);
  const res = await fetch(
    `${base}/listings/2021-08-01/items/${creds.sellerId}?marketplaceIds=ATVPDKIKX0DER`,
    { headers: { "x-amz-access-token": token } }
  );
  if (!res.ok) throw new Error(`Amazon listings error: ${res.status}`);
  const data = await res.json() as { items?: AmazonListing[] };
  const products = (data.items ?? []).map((l) => ({
    externalId: l.sku,
    sku: l.sku,
    name: l.summaries?.[0]?.itemName ?? l.sku,
    quantity: l.fulfillmentAvailability?.[0]?.quantity ?? 0,
  }));
  return importer(products);
}

// ── Amazon API types ──────────────────────────────────────────────────────────

interface AmazonOrder {
  AmazonOrderId: string;
  PurchaseDate?: string;
  ShipmentServiceLevelCategory?: string;
}

interface AmazonOrderItem {
  OrderItemId: string;
  SellerSKU?: string;
  QuantityOrdered?: number;
}

interface AmazonListing {
  sku: string;
  summaries?: { itemName?: string }[];
  fulfillmentAvailability?: { quantity?: number }[];
}

function mapOrder(o: AmazonOrder): Omit<ConnectorOrder, "items"> {
  return {
    externalId: o.AmazonOrderId,
    orderNumber: o.AmazonOrderId,
  };
}
