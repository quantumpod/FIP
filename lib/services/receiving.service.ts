import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { createReceivingOrderSchema } from "@/lib/validations/warehouse-ops";

const include = {
  warehouse: { select: { id: true, name: true, code: true } },
  items: {
    include: {
      product: { select: { id: true, masterSku: true, name: true, barcode: true } },
    },
  },
  putawayTasks: { select: { id: true, status: true } },
};

export async function getReceivingOrders(
  companyId: string,
  params: { query?: string; status?: string; page: number; limit: number }
) {
  const { query, status, page, limit } = params;
  const where = {
    companyId,
    ...(status && { status: status as never }),
    ...(query && {
      OR: [
        { poNumber: { contains: query, mode: "insensitive" as const } },
        { supplier: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  };
  const [data, total] = await Promise.all([
    prisma.receivingOrder.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.receivingOrder.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function getReceivingOrderById(companyId: string, id: string) {
  return prisma.receivingOrder.findFirst({ where: { id, companyId }, include });
}

export async function createReceivingOrder(
  companyId: string,
  input: z.infer<typeof createReceivingOrderSchema>
) {
  return prisma.receivingOrder.create({
    data: {
      companyId,
      warehouseId: input.warehouseId,
      poNumber: input.poNumber,
      supplier: input.supplier,
      notes: input.notes,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          expectedQty: item.expectedQty,
          lotNumber: item.lotNumber,
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
        })),
      },
    },
    include,
  });
}

export async function receiveItems(
  companyId: string,
  id: string,
  items: { id: string; receivedQty: number }[]
) {
  const order = await prisma.receivingOrder.findFirst({
    where: { id, companyId },
    include: { items: true },
  });
  if (!order) throw new Error("Not found");
  if (order.status === "COMPLETED" || order.status === "CANCELLED") {
    throw new Error("Cannot update a completed or cancelled receiving order");
  }

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const existing = order.items.find((i) => i.id === item.id);
      if (!existing) continue;
      await tx.receivingItem.update({
        where: { id: item.id },
        data: { receivedQty: item.receivedQty },
      });
    }

    const allReceived = order.items.every((i) => {
      const updated = items.find((u) => u.id === i.id);
      return (updated?.receivedQty ?? i.receivedQty) >= i.expectedQty;
    });

    await tx.receivingOrder.update({
      where: { id },
      data: {
        status: allReceived ? "COMPLETED" : "IN_PROGRESS",
        receivedAt: allReceived ? new Date() : undefined,
      },
    });
  });

  return prisma.receivingOrder.findFirst({ where: { id }, include });
}

export async function cancelReceivingOrder(companyId: string, id: string) {
  const order = await prisma.receivingOrder.findFirst({ where: { id, companyId } });
  if (!order) throw new Error("Not found");
  if (order.status === "COMPLETED") throw new Error("Cannot cancel a completed order");
  return prisma.receivingOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
    include,
  });
}
