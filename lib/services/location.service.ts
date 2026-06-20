import { prisma } from "@/lib/prisma";
import type {
  CreateLocationInput,
  UpdateLocationInput,
  SearchLocationsInput,
} from "@/lib/validations/inventory";

const locationInclude = {
  warehouse: { select: { id: true, name: true, code: true } },
  _count: { select: { inventoryItems: true } },
};

export async function getLocations(companyId: string, params: SearchLocationsInput) {
  const { query, warehouseId, isActive, page, limit } = params;
  const skip = (page - 1) * limit;

  const where = {
    warehouse: { companyId },
    ...(warehouseId && { warehouseId }),
    ...(isActive !== undefined && { isActive }),
    ...(query && {
      OR: [
        { code: { contains: query, mode: "insensitive" as const } },
        { zone: { contains: query, mode: "insensitive" as const } },
        { aisle: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.location.findMany({
      where,
      skip,
      take: limit,
      orderBy: { code: "asc" },
      include: locationInclude,
    }),
    prisma.location.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getLocationById(companyId: string, id: string) {
  return prisma.location.findFirst({
    where: { id, warehouse: { companyId } },
    include: {
      ...locationInclude,
      inventoryItems: {
        include: { product: { select: { id: true, masterSku: true, name: true, status: true } } },
      },
    },
  });
}

export async function createLocation(companyId: string, input: CreateLocationInput) {
  // Verify warehouse belongs to company
  const warehouse = await prisma.warehouse.findFirst({ where: { id: input.warehouseId, companyId } });
  if (!warehouse) throw new Error("WAREHOUSE_NOT_FOUND");

  return prisma.location.create({
    data: input,
    include: locationInclude,
  });
}

export async function updateLocation(companyId: string, id: string, input: UpdateLocationInput) {
  const location = await prisma.location.findFirst({ where: { id, warehouse: { companyId } } });
  if (!location) throw new Error("NOT_FOUND");

  return prisma.location.update({ where: { id }, data: input, include: locationInclude });
}

export async function deleteLocation(companyId: string, id: string) {
  const location = await prisma.location.findFirst({ where: { id, warehouse: { companyId } } });
  if (!location) throw new Error("NOT_FOUND");
  return prisma.location.delete({ where: { id } });
}
