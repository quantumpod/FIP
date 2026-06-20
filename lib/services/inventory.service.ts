import { prisma } from "@/lib/prisma";
import type { AdjustInventoryInput, SearchInventoryInput } from "@/lib/validations/inventory";

const inventoryInclude = {
  product: { select: { id: true, masterSku: true, name: true, status: true } },
  location: {
    include: { warehouse: { select: { id: true, name: true, code: true } } },
  },
};

export async function getInventory(companyId: string, params: SearchInventoryInput) {
  const { query, locationId, productId, page, limit } = params;
  const skip = (page - 1) * limit;

  const where = {
    product: { companyId },
    ...(locationId && { locationId }),
    ...(productId && { productId }),
    ...(query && {
      OR: [
        { product: { masterSku: { contains: query, mode: "insensitive" as const } } },
        { product: { name: { contains: query, mode: "insensitive" as const } } },
        { location: { code: { contains: query, mode: "insensitive" as const } } },
        { lotNumber: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ product: { masterSku: "asc" } }, { location: { code: "asc" } }],
      include: inventoryInclude,
    }),
    prisma.inventoryItem.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getInventoryById(companyId: string, id: string) {
  return prisma.inventoryItem.findFirst({
    where: { id, product: { companyId } },
    include: inventoryInclude,
  });
}

export async function adjustInventory(companyId: string, input: AdjustInventoryInput) {
  const { productId, locationId, onHand, allocated, lotNumber, expiresAt } = input;

  // Verify product and location belong to company
  const [product, location] = await Promise.all([
    prisma.product.findFirst({ where: { id: productId, companyId } }),
    prisma.location.findFirst({ where: { id: locationId, warehouse: { companyId } } }),
  ]);
  if (!product) throw new Error("PRODUCT_NOT_FOUND");
  if (!location) throw new Error("LOCATION_NOT_FOUND");

  const allocatedQty = allocated ?? 0;
  const available = Math.max(0, onHand - allocatedQty);

  const existing = await prisma.inventoryItem.findFirst({
    where: { productId, locationId, lotNumber: lotNumber ?? null },
  });

  if (existing) {
    return prisma.inventoryItem.update({
      where: { id: existing.id },
      data: { onHand, allocated: allocatedQty, available, expiresAt: expiresAt ? new Date(expiresAt) : null },
      include: inventoryInclude,
    });
  }

  return prisma.inventoryItem.create({
    data: {
      productId,
      locationId,
      onHand,
      allocated: allocatedQty,
      available,
      lotNumber: lotNumber ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: inventoryInclude,
  });
}

export async function deleteInventoryItem(companyId: string, id: string) {
  const item = await prisma.inventoryItem.findFirst({ where: { id, product: { companyId } } });
  if (!item) throw new Error("NOT_FOUND");
  return prisma.inventoryItem.delete({ where: { id } });
}
