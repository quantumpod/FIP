import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getConnectionById, updateConnection } from "@/lib/services/integrations.service";
import { veeqoValidate } from "@/lib/connectors/veeqo.connector";
import { shopifyValidate } from "@/lib/connectors/shopify.connector";
import { amazonValidate } from "@/lib/connectors/amazon.connector";
import { walmartValidate } from "@/lib/connectors/walmart.connector";
import { ebayValidate } from "@/lib/connectors/ebay.connector";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;

  const { id } = await params;
  const conn = await getConnectionById(companyId, id);
  if (!conn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const creds = (conn.credentials as Record<string, string>) ?? {};
  const settings = (conn.settings as Record<string, string>) ?? {};

  try {
    let valid = false;

    switch (conn.marketplace) {
      case "VEEQO":
        valid = await veeqoValidate(creds.apiKey);
        break;
      case "SHOPIFY":
        valid = await shopifyValidate(settings.shopUrl ?? creds.shopUrl, creds.accessToken);
        break;
      case "AMAZON":
        valid = await amazonValidate({
          sellerId: settings.sellerId ?? creds.sellerId,
          clientId: creds.accessKeyId,
          clientSecret: creds.secretKey,
          refreshToken: creds.refreshToken,
          region: settings.region ?? "us-east-1",
        });
        break;
      case "WALMART":
        valid = await walmartValidate(creds.clientId, creds.clientSecret);
        break;
      case "EBAY":
        valid = await ebayValidate(creds.appId, creds.certId, creds.userToken);
        break;
      default:
        return NextResponse.json({ valid: false, error: "Marketplace not supported for validation" });
    }

    if (valid) {
      await updateConnection(companyId, id, { status: "ACTIVE" });
    } else {
      await updateConnection(companyId, id, { status: "ERROR" });
    }

    return NextResponse.json({ valid });
  } catch (e: unknown) {
    await updateConnection(companyId, id, { status: "ERROR" });
    return NextResponse.json({ valid: false, error: (e as Error).message });
  }
}
