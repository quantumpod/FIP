import { prisma } from "@/lib/prisma";

const include = {
  warehouse: { select: { id: true, name: true, code: true } },
  location: { select: { id: true, code: true } },
  items: {
    include: { product: { select: { id: true, masterSku: true, name: true } } },
  },
};

export async function getPallets(
  companyId: string,
  params: { query?: string; page: number; limit: number }
) {
  const { query, page, limit } = params;
  const where = {
    companyId,
    ...(query && { code: { contains: query, mode: "insensitive" as const } }),
  };
  const [data, total] = await Promise.all([
    prisma.pallet.findMany({ where, include, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.pallet.count({ where }),
  ]);
  return { data, total, page, limit };
}

export async function getPalletById(companyId: string, id: string) {
  return prisma.pallet.findFirst({ where: { id, companyId }, include });
}

export async function createPallet(
  companyId: string,
  input: { warehouseId: string; code: string; locationId?: string; notes?: string }
) {
  return prisma.pallet.create({ data: { companyId, ...input }, include });
}

export async function updatePallet(
  companyId: string,
  id: string,
  data: { locationId?: string; isSealed?: boolean; notes?: string }
) {
  const pallet = await prisma.pallet.findFirst({ where: { id, companyId } });
  if (!pallet) throw new Error("Not found");
  if (pallet.isSealed && data.isSealed !== false) throw new Error("Cannot modify a sealed pallet");
  return prisma.pallet.update({ where: { id }, data, include });
}

export async function addPalletItem(
  companyId: string,
  palletId: string,
  input: { productId: string; quantity: number; lotNumber?: string }
) {
  const pallet = await prisma.pallet.findFirst({ where: { id: palletId, companyId } });
  if (!pallet) throw new Error("Not found");
  if (pallet.isSealed) throw new Error("Cannot add items to a sealed pallet");
  await prisma.palletItem.create({ data: { palletId, ...input } });
  return prisma.pallet.findFirst({ where: { id: palletId }, include });
}

export async function removePalletItem(companyId: string, palletId: string, itemId: string) {
  const pallet = await prisma.pallet.findFirst({ where: { id: palletId, companyId } });
  if (!pallet) throw new Error("Not found");
  if (pallet.isSealed) throw new Error("Cannot remove items from a sealed pallet");
  await prisma.palletItem.delete({ where: { id: itemId } });
  return prisma.pallet.findFirst({ where: { id: palletId }, include });
}

export async function deletePallet(companyId: string, id: string) {
  const pallet = await prisma.pallet.findFirst({ where: { id, companyId } });
  if (!pallet) throw new Error("Not found");
  if (pallet.isSealed) throw new Error("Cannot delete a sealed pallet");
  await prisma.palletItem.deleteMany({ where: { palletId: id } });
  await prisma.pallet.delete({ where: { id } });
}
