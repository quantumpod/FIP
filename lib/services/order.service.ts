import { prisma } from "@/lib/prisma";
import type { CreateOrderInput, UpdateOrderInput, SearchOrdersInput } from "@/lib/validations/order";

const orderInclude = {
  items: {
    include: {
      product: { select: { id: true, masterSku: true, name: true, status: true } },
    },
  },
  pickTasks: { select: { id: true, status: true } },
};

export async function getOrders(companyId: string, params: SearchOrdersInput) {
  const { query, status, marketplace, page, limit } = params;
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    ...(status && { status }),
    ...(marketplace && { marketplace }),
    ...(query && {
      OR: [
        { orderNumber: { contains: query, mode: "insensitive" as const } },
        { trackingNumber: { contains: query, mode: "insensitive" as const } },
        { externalOrderId: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    }),
    prisma.order.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getOrderById(companyId: string, id: string) {
  return prisma.order.findFirst({
    where: { id, companyId },
    include: orderInclude,
  });
}

export async function getOrderByTracking(companyId: string, trackingNumber: string) {
  return prisma.order.findFirst({
    where: {
      companyId,
      trackingNumber: { equals: trackingNumber, mode: "insensitive" },
    },
    include: orderInclude,
  });
}

export async function createOrder(companyId: string, input: CreateOrderInput) {
  const { items, ...orderData } = input;
  return prisma.order.create({
    data: {
      ...orderData,
      companyId,
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          listingId: item.listingId ?? null,
          quantity: item.quantity,
        })),
      },
    },
    include: orderInclude,
  });
}

export async function updateOrder(companyId: string, id: string, input: UpdateOrderInput) {
  return prisma.order.update({
    where: { id, companyId },
    data: input,
    include: orderInclude,
  });
}

export async function deleteOrder(companyId: string, id: string) {
  return prisma.order.delete({ where: { id, companyId } });
}
