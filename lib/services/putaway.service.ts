import { prisma } from "@/lib/prisma";

const include = {
  receivingOrder: { select: { poNumber: true } },
  items: {
    include: {
      product: { select: { id: true, masterSku: true, name: true } },
      location: { select: { id: true, code: true } },
    },
  },
};

export async function getPutawayTasks(
  companyId: string,
  params: { status?: string; page: number; limit: number }
) {
  const { status, page, limit } = params;
  const where = {
    companyId,
    ...(status && { status: status as never }),
  };
  const [data, total] = await Promise.all([
    prisma.putawayTask.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.putawayTask.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function getPutawayTaskById(companyId: string, id: string) {
  return prisma.putawayTask.findFirst({ where: { id, companyId }, include });
}

export async function generatePutawayTask(companyId: string, receivingOrderId: string) {
  const order = await prisma.receivingOrder.findFirst({
    where: { id: receivingOrderId, companyId },
    include: { items: { include: { product: { include: { inventoryItems: { include: { location: true }, take: 1 } } } } } },
  });
  if (!order) throw new Error("Receiving order not found");

  const existingOpen = await prisma.putawayTask.findFirst({
    where: { companyId, receivingOrderId, status: { in: ["OPEN", "IN_PROGRESS"] } },
  });
  if (existingOpen) throw new Error("An open putaway task already exists for this receiving order");

  return prisma.putawayTask.create({
    data: {
      companyId,
      receivingOrderId,
      items: {
        create: order.items.map((item) => {
          const existingLocation = item.product.inventoryItems[0]?.location;
          return {
            productId: item.productId,
            quantity: item.receivedQty > 0 ? item.receivedQty : item.expectedQty,
            locationId: existingLocation?.id ?? order.items[0]?.product.inventoryItems[0]?.locationId ?? "",
            putawayQty: 0,
          };
        }).filter((i) => i.locationId),
      },
    },
    include,
  });
}

export async function updatePutawayTask(companyId: string, id: string, status: string) {
  const task = await prisma.putawayTask.findFirst({ where: { id, companyId }, include });
  if (!task) throw new Error("Not found");

  if (status === "COMPLETED") {
    await prisma.$transaction(async (tx) => {
      for (const item of task.items) {
        if (item.putawayQty > 0) {
          const inv = await tx.inventoryItem.findFirst({
            where: { productId: item.productId, locationId: item.locationId, lotNumber: null },
          });
          if (inv) {
            await tx.inventoryItem.update({
              where: { id: inv.id },
              data: {
                onHand: { increment: item.putawayQty },
                available: { increment: item.putawayQty },
              },
            });
          } else {
            await tx.inventoryItem.create({
              data: {
                productId: item.productId,
                locationId: item.locationId,
                onHand: item.putawayQty,
                allocated: 0,
                available: item.putawayQty,
              },
            });
          }
        }
      }
      await tx.putawayTask.update({ where: { id }, data: { status: "COMPLETED" } });
    });
    return prisma.putawayTask.findFirst({ where: { id }, include });
  }

  return prisma.putawayTask.update({ where: { id }, data: { status: status as never }, include });
}

export async function updatePutawayTaskItem(
  companyId: string,
  taskId: string,
  itemId: string,
  putawayQty: number
) {
  const task = await prisma.putawayTask.findFirst({ where: { id: taskId, companyId } });
  if (!task) throw new Error("Not found");
  return prisma.putawayTaskItem.update({ where: { id: itemId }, data: { putawayQty } });
}
