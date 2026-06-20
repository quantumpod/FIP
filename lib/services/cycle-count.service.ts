import { prisma } from "@/lib/prisma";

const include = {
  warehouse: { select: { id: true, name: true, code: true } },
  items: {
    include: {
      location: { select: { id: true, code: true } },
      product: { select: { id: true, masterSku: true, name: true } },
    },
  },
};

export async function getCycleCounts(
  companyId: string,
  params: { status?: string; page: number; limit: number }
) {
  const { status, page, limit } = params;
  const where = { companyId, ...(status && { status: status as never }) };
  const [data, total] = await Promise.all([
    prisma.cycleCount.findMany({
      where,
      include,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cycleCount.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function getCycleCountById(companyId: string, id: string) {
  return prisma.cycleCount.findFirst({ where: { id, companyId }, include });
}

export async function createCycleCount(
  companyId: string,
  input: { warehouseId: string; locationIds: string[]; notes?: string }
) {
  const inventoryItems = await prisma.inventoryItem.findMany({
    where: { locationId: { in: input.locationIds } },
    select: { productId: true, locationId: true, available: true },
  });

  return prisma.cycleCount.create({
    data: {
      companyId,
      warehouseId: input.warehouseId,
      notes: input.notes,
      items: {
        create: inventoryItems.map((inv) => ({
          locationId: inv.locationId,
          productId: inv.productId,
          systemQty: inv.available,
          countedQty: null,
          variance: null,
        })),
      },
    },
    include,
  });
}

export async function submitCycleCountItem(
  companyId: string,
  countId: string,
  itemId: string,
  countedQty: number
) {
  const count = await prisma.cycleCount.findFirst({ where: { id: countId, companyId } });
  if (!count) throw new Error("Not found");

  const item = await prisma.cycleCountItem.findFirst({ where: { id: itemId, cycleCountId: countId } });
  if (!item) throw new Error("Item not found");

  const variance = countedQty - item.systemQty;

  await prisma.cycleCountItem.update({
    where: { id: itemId },
    data: { countedQty, variance },
  });

  if (count.status === "OPEN") {
    await prisma.cycleCount.update({ where: { id: countId }, data: { status: "IN_PROGRESS" } });
  }

  return prisma.cycleCount.findFirst({ where: { id: countId }, include });
}

export async function completeCycleCount(companyId: string, id: string) {
  const count = await prisma.cycleCount.findFirst({ where: { id, companyId }, include });
  if (!count) throw new Error("Not found");

  const uncounted = count.items.filter((i) => i.countedQty === null);
  if (uncounted.length > 0) throw new Error(`${uncounted.length} items not yet counted`);

  await prisma.$transaction(async (tx) => {
    for (const item of count.items) {
      if (item.variance !== 0 && item.countedQty !== null) {
        const inv = await tx.inventoryItem.findFirst({
          where: { productId: item.productId, locationId: item.locationId, lotNumber: null },
        });
        if (inv) {
          const newOnHand = Math.max(0, inv.onHand + (item.variance ?? 0));
          const newAvailable = Math.max(0, newOnHand - inv.allocated);
          await tx.inventoryItem.update({
            where: { id: inv.id },
            data: { onHand: newOnHand, available: newAvailable },
          });
        }
      }
    }
    await tx.cycleCount.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  });

  return prisma.cycleCount.findFirst({ where: { id }, include });
}
