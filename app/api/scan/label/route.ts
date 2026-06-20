import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/scan/label
// Records a scanned shipping label against an order
export async function POST(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;

  const { orderId, trackingNumber, carrier } = await req.json();
  if (!orderId || !trackingNumber) {
    return NextResponse.json({ error: "orderId and trackingNumber required" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({ where: { id: orderId, companyId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Update order tracking if not already set
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      trackingNumber,
      ...(carrier && { carrier }),
      status: order.status === "NEW" || order.status === "READY_TO_PICK" || order.status === "PICKING"
        ? "PACKED"
        : order.status,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      companyId,
      action: "LABEL_SCANNED",
      entity: "Order",
      entityId: orderId,
      metadata: { trackingNumber, carrier, orderNumber: order.orderNumber },
    },
  });

  return NextResponse.json(updated);
}
