import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/scan/order?q=<order_number_or_tracking>
// Searches by order number OR tracking number — used by Pick & Pack scanner
export async function GET(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) return NextResponse.json({ error: "Query too short" }, { status: 400 });

  // Normalize: remove leading # if present
  const normalized = q.replace(/^#/, "");

  const order = await prisma.order.findFirst({
    where: {
      companyId,
      OR: [
        { orderNumber: q },
        { orderNumber: `#${normalized}` },
        { orderNumber: normalized },
        { trackingNumber: q },
        { trackingNumber: normalized },
        { externalOrderId: normalized },
      ],
    },
    include: {
      items: {
        include: {
          product: { select: { id: true, masterSku: true, name: true, barcode: true } },
          listing: { select: { id: true, sellerSku: true, marketplace: true } },
        },
      },
    },
  });

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(order);
}
