import { prisma } from "@/lib/prisma";
import { ProductStatus } from "@/lib/generated/prisma";
import type { CreateProductInput, UpdateProductInput, SearchProductsInput } from "@/lib/validations/product";

export async function getProducts(companyId: string, params: SearchProductsInput) {
  const { query, status, page, limit } = params;
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    ...(status && { status: status as ProductStatus }),
    ...(query && {
      OR: [
        { masterSku: { contains: query, mode: "insensitive" as const } },
        { name: { contains: query, mode: "insensitive" as const } },
        { barcode: { contains: query, mode: "insensitive" as const } },
        { brand: { contains: query, mode: "insensitive" as const } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getProductById(companyId: string, id: string) {
  return prisma.product.findFirst({
    where: { id, companyId },
    include: { listings: true },
  });
}

export async function createProduct(companyId: string, data: CreateProductInput) {
  return prisma.product.create({
    data: {
      ...data,
      companyId,
      length: data.length ? data.length : null,
      width: data.width ? data.width : null,
      height: data.height ? data.height : null,
      weight: data.weight ? data.weight : null,
    },
  });
}

export async function updateProduct(companyId: string, id: string, data: UpdateProductInput) {
  const existing = await prisma.product.findFirst({ where: { id, companyId } });
  if (!existing) return null;

  return prisma.product.update({
    where: { id },
    data: {
      ...data,
      length: data.length !== undefined ? data.length : undefined,
      width: data.width !== undefined ? data.width : undefined,
      height: data.height !== undefined ? data.height : undefined,
      weight: data.weight !== undefined ? data.weight : undefined,
    },
  });
}

export async function deleteProduct(companyId: string, id: string) {
  const existing = await prisma.product.findFirst({ where: { id, companyId } });
  if (!existing) return null;

  return prisma.product.delete({ where: { id } });
}

export async function searchProducts(companyId: string, query: string) {
  if (!query || query.length < 3) return [];
  return prisma.product.findMany({
    where: {
      companyId,
      OR: [
        { masterSku: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
    orderBy: { masterSku: "asc" },
  });
}
