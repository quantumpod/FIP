import { prisma } from "@/lib/prisma";
import type { SearchPickTasksInput, UpdatePickTaskInput, UpdatePickTaskItemInput } from "@/lib/validations/pick-task";

const pickTaskInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      marketplace: true,
      trackingNumber: true,
      status: true,
    },
  },
  items: {
    include: {
      product: { select: { id: true, masterSku: true, name: true } },
      location: { select: { id: true, code: true } },
    },
  },
};

export async function getPickTasks(companyId: string, params: SearchPickTasksInput) {
  const { query, status, page, limit } = params;
  const skip = (page - 1) * limit;

  const where = {
    order: { companyId },
    ...(status && { status }),
    ...(query && {
      OR: [
        { order: { orderNumber: { contains: query, mode: "insensitive" as const } } },
        { order: { trackingNumber: { contains: query, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.pickTask.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: pickTaskInclude,
    }),
    prisma.pickTask.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPickTaskById(companyId: string, id: string) {
  return prisma.pickTask.findFirst({
    where: { id, order: { companyId } },
    include: pickTaskInclude,
  });
}

export async function generatePickTask(companyId: string, orderId: string) {
  // Load order with items and inventory
  const order = await prisma.order.findFirst({
    where: { id: orderId, companyId },
    include: {
      items: {
        include: {
          product: {
            include: {
              inventoryItems: {
                where: { available: { gt: 0 } },
                include: { location: true },
                orderBy: { available: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!order) throw new Error("ORDER_NOT_FOUND");

  // Build pick task items: one item per product × location with enough stock
  const pickItems: { productId: string; locationId: string; quantity: number }[] = [];

  for (const orderItem of order.items) {
    let remaining = orderItem.quantity;
    const inventory = orderItem.product.inventoryItems;

    for (const inv of inventory) {
      if (remaining <= 0) break;
      const pickQty = Math.min(remaining, inv.available);
      pickItems.push({
        productId: orderItem.productId,
        locationId: inv.locationId,
        quantity: pickQty,
      });
      remaining -= pickQty;
    }
  }

  if (pickItems.length === 0) throw new Error("NO_INVENTORY");

  const pickTask = await prisma.pickTask.create({
    data: {
      orderId,
      status: "OPEN",
      items: { create: pickItems },
    },
    include: pickTaskInclude,
  });

  // Update order status to PICKING if it was READY_TO_PICK
  if (order.status === "READY_TO_PICK") {
    await prisma.order.update({ where: { id: orderId }, data: { status: "PICKING" } });
  }

  return pickTask;
}

export async function updatePickTask(companyId: string, id: string, input: UpdatePickTaskInput) {
  const task = await prisma.pickTask.findFirst({ where: { id, order: { companyId } } });
  if (!task) throw new Error("NOT_FOUND");

  const updated = await prisma.pickTask.update({
    where: { id },
    data: { status: input.status },
    include: pickTaskInclude,
  });

  // Sync order status when task completes
  if (input.status === "COMPLETED") {
    await prisma.order.update({ where: { id: task.orderId }, data: { status: "PACKED" } });
  }

  return updated;
}

export async function updatePickTaskItem(
  companyId: string,
  taskId: string,
  itemId: string,
  input: UpdatePickTaskItemInput
) {
  const task = await prisma.pickTask.findFirst({ where: { id: taskId, order: { companyId } } });
  if (!task) throw new Error("NOT_FOUND");

  return prisma.pickTaskItem.update({
    where: { id: itemId },
    data: { pickedQty: input.pickedQty },
  });
}

export async function deletePickTask(companyId: string, id: string) {
  const task = await prisma.pickTask.findFirst({ where: { id, order: { companyId } } });
  if (!task) throw new Error("NOT_FOUND");
  return prisma.pickTask.delete({ where: { id } });
}
