import { prisma } from "@/lib/prisma";
import type { ConnectorOrder, ConnectorProduct, SyncResult } from "./types";
import { syncVeeqoOrders, syncVeeqoInventory } from "./veeqo.connector";
import { syncShopifyOrders, syncShopifyInventory } from "./shopify.connector";
import { syncAmazonOrders, syncAmazonListings } from "./amazon.connector";
import { syncWalmartOrders, syncWalmartInventory } from "./walmart.connector";
import { syncEbayOrders, syncEbayListings } from "./ebay.connector";

export type { SyncResult };

export async function runConnectorSync(
  companyId: string,
  marketplace: string,
  syncType: string,
  credentials: Record<string, string>,
  settings: Record<string, string>
): Promise<SyncResult> {
  const orderImporter = makeOrderImporter(companyId, marketplace);
  const productImporter = makeProductImporter(companyId);

  switch (marketplace) {
    case "VEEQO": {
      const apiKey = credentials.apiKey;
      if (!apiKey) throw new Error("Veeqo API Key is required");
      if (syncType === "ORDERS") return syncVeeqoOrders(apiKey, orderImporter);
      if (syncType === "INVENTORY") return syncVeeqoInventory(apiKey, productImporter);
      return { imported: 0, skipped: 0, errors: ["Unsupported sync type"] };
    }

    case "SHOPIFY": {
      const shopUrl = settings.shopUrl ?? credentials.shopUrl;
      const accessToken = credentials.accessToken;
      if (!shopUrl || !accessToken) throw new Error("Shopify Shop URL and Access Token are required");
      if (syncType === "ORDERS") return syncShopifyOrders(shopUrl, accessToken, orderImporter);
      if (syncType === "INVENTORY") return syncShopifyInventory(shopUrl, accessToken, productImporter);
      return { imported: 0, skipped: 0, errors: ["Unsupported sync type"] };
    }

    case "AMAZON": {
      const creds = {
        sellerId: settings.sellerId ?? credentials.sellerId,
        clientId: credentials.accessKeyId,
        clientSecret: credentials.secretKey,
        refreshToken: credentials.refreshToken,
        region: settings.region ?? "us-east-1",
      };
      if (!creds.clientId || !creds.clientSecret || !creds.refreshToken)
        throw new Error("Amazon LWA credentials are required");
      if (syncType === "ORDERS") return syncAmazonOrders(creds, orderImporter);
      if (syncType === "LISTINGS") return syncAmazonListings(creds, productImporter);
      return { imported: 0, skipped: 0, errors: ["Unsupported sync type"] };
    }

    case "WALMART": {
      const clientId = credentials.clientId;
      const clientSecret = credentials.clientSecret;
      if (!clientId || !clientSecret) throw new Error("Walmart Client ID and Client Secret are required");
      if (syncType === "ORDERS") return syncWalmartOrders(clientId, clientSecret, orderImporter);
      if (syncType === "INVENTORY") return syncWalmartInventory(clientId, clientSecret, productImporter);
      return { imported: 0, skipped: 0, errors: ["Unsupported sync type"] };
    }

    case "EBAY": {
      const appId = credentials.appId;
      const certId = credentials.certId;
      const userToken = credentials.userToken;
      if (!appId || !certId || !userToken) throw new Error("eBay App ID, Cert ID, and User Token are required");
      if (syncType === "ORDERS") return syncEbayOrders(appId, certId, userToken, orderImporter);
      if (syncType === "LISTINGS") return syncEbayListings(appId, certId, userToken, productImporter);
      return { imported: 0, skipped: 0, errors: ["Unsupported sync type"] };
    }

    default:
      return { imported: 0, skipped: 0, errors: [`Unsupported marketplace: ${marketplace}`] };
  }
}

// ── Importers ─────────────────────────────────────────────────────────────────

function makeOrderImporter(companyId: string, marketplace: string) {
  return async (orders: ConnectorOrder[]): Promise<SyncResult> => {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const o of orders) {
      try {
        const existing = await prisma.order.findFirst({
          where: {
            companyId,
            externalOrderId: o.externalId,
          },
        });

        if (existing) { skipped++; continue; }

        // Ensure unique orderNumber per company
        const baseNumber = o.orderNumber;
        let orderNumber = baseNumber;
        const conflict = await prisma.order.findFirst({ where: { companyId, orderNumber } });
        if (conflict) orderNumber = `${baseNumber}-${Date.now()}`;

        const order = await prisma.order.create({
          data: {
            companyId,
            marketplace: marketplace as never,
            externalOrderId: o.externalId,
            orderNumber,
            trackingNumber: o.trackingNumber,
            carrier: o.carrier,
            status: "NEW",
          },
        });

        for (const item of o.items) {
          // Try to map sellerSku to a product via listings
          const listing = await prisma.listing.findFirst({
            where: { companyId, sellerSku: item.sellerSku },
            select: { productId: true },
          });

          if (listing) {
            await prisma.orderItem.create({
              data: {
                orderId: order.id,
                productId: listing.productId,
                listingId: undefined,
                quantity: item.quantity,
              },
            });
          }
          // Skip items with no mapped product (no error — just unmapped)
        }

        imported++;
      } catch (err) {
        errors.push(`Order ${o.orderNumber}: ${(err as Error).message}`);
      }
    }

    return { imported, skipped, errors };
  };
}

function makeProductImporter(companyId: string) {
  return async (products: ConnectorProduct[]): Promise<SyncResult> => {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const p of products) {
      try {
        // Find product by masterSku matching the connector SKU
        const product = await prisma.product.findFirst({
          where: { companyId, masterSku: p.sku },
        });

        if (!product) { skipped++; continue; }

        // Find first inventory location and update onHand
        const inv = await prisma.inventoryItem.findFirst({
          where: { productId: product.id },
        });

        if (inv) {
          await prisma.inventoryItem.update({
            where: { id: inv.id },
            data: {
              onHand: p.quantity,
              available: Math.max(0, p.quantity - inv.allocated),
            },
          });
          imported++;
        } else {
          skipped++;
        }
      } catch (err) {
        errors.push(`Product ${p.sku}: ${(err as Error).message}`);
      }
    }

    return { imported, skipped, errors };
  };
}
