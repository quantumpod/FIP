import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const [
    totalOrders,
    readyToPick,
    openPickTasks,
    lowStockItems,
    recentOrders,
    recentPickTasks,
  ] = await Promise.all([
    prisma.order.count({ where: { companyId } }),
    prisma.order.count({ where: { companyId, status: "READY_TO_PICK" } }),
    prisma.pickTask.count({ where: { order: { companyId }, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.inventoryItem.count({ where: { product: { companyId }, available: { lte: 10 } } }),
    prisma.order.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        marketplace: true,
        status: true,
        trackingNumber: true,
        createdAt: true,
        items: { select: { quantity: true } },
      },
    }),
    prisma.pickTask.findMany({
      where: { order: { companyId } },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        status: true,
        updatedAt: true,
        order: { select: { orderNumber: true, marketplace: true } },
        items: { select: { quantity: true, pickedQty: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: { totalOrders, readyToPick, openPickTasks, lowStockItems },
    recentOrders,
    recentPickTasks,
  });
}
