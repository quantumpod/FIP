import { prisma } from "@/lib/prisma";
import type { CreateListingInput, UpdateListingInput, SearchListingsInput } from "@/lib/validations/listing";

export async function getListings(companyId: string, params: SearchListingsInput) {
  const { query, marketplace, productId, page, limit } = params;
  const skip = (page - 1) * limit;

  const where = {
    companyId,
    ...(marketplace && { marketplace }),
    ...(productId && { productId }),
    ...(query && {
      OR: [
        { sellerSku: { contains: query, mode: "insensitive" as const } },
        { asin: { contains: query, mode: "insensitive" as const } },
        { fnsku: { contains: query, mode: "insensitive" as const } },
        { product: { masterSku: { contains: query, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { product: { select: { id: true, masterSku: true, name: true, status: true } } },
    }),
    prisma.listing.count({ where }),
  ]);

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getListingById(companyId: string, id: string) {
  return prisma.listing.findFirst({
    where: { id, companyId },
    include: { product: { select: { id: true, masterSku: true, name: true, status: true } } },
  });
}

export async function createListing(companyId: string, input: CreateListingInput) {
  return prisma.listing.create({
    data: { ...input, companyId },
    include: { product: { select: { id: true, masterSku: true, name: true, status: true } } },
  });
}

export async function updateListing(companyId: string, id: string, input: UpdateListingInput) {
  return prisma.listing.update({
    where: { id, companyId },
    data: input,
    include: { product: { select: { id: true, masterSku: true, name: true, status: true } } },
  });
}

export async function deleteListing(companyId: string, id: string) {
  return prisma.listing.delete({ where: { id, companyId } });
}

export async function findProductBySellerSku(companyId: string, sellerSku: string, marketplace?: string) {
  const listing = await prisma.listing.findFirst({
    where: {
      companyId,
      sellerSku: { equals: sellerSku, mode: "insensitive" },
      ...(marketplace && { marketplace: marketplace as never }),
    },
    include: {
      product: {
        include: {
          inventoryItems: { include: { location: true } },
          listings: true,
        },
      },
    },
  });
  return listing;
}
