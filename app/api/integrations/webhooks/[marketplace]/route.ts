import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestWebhook } from "@/lib/services/integrations.service";

// Public endpoint — no auth required, receives webhooks from marketplaces
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ marketplace: string }> }
) {
  const { marketplace } = await params;
  const validMarketplaces = ["AMAZON", "WALMART", "EBAY", "SHOPIFY", "VEEQO"];
  if (!validMarketplaces.includes(marketplace.toUpperCase())) {
    return NextResponse.json({ error: "Unknown marketplace" }, { status: 400 });
  }

  const event = req.headers.get("x-webhook-event") ?? req.headers.get("x-shopify-topic") ?? "unknown";
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  // Try to find matching connection (by marketplace, status=ACTIVE)
  // Without company context we can't isolate, so we store for all active connections
  const connections = await prisma.marketplaceConnection.findMany({
    where: { marketplace: marketplace.toUpperCase() as never, status: "ACTIVE" },
    select: { id: true, companyId: true },
  });

  if (connections.length === 0) {
    // Store without connection reference — use first company as fallback
    const company = await prisma.company.findFirst({ select: { id: true } });
    if (company) {
      await ingestWebhook(company.id, marketplace.toUpperCase(), event, payload);
    }
  } else {
    for (const conn of connections) {
      await ingestWebhook(conn.companyId, marketplace.toUpperCase(), event, payload, conn.id);
    }
  }

  return NextResponse.json({ received: true });
}
