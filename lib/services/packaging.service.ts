import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import type {
  CreatePackagingRuleInput,
  UpdatePackagingRuleInput,
  SearchPackagingRulesInput,
  RecommendPackagingInput,
} from "@/lib/validations/packaging";

type DbRule = Prisma.PackagingRuleGetPayload<Record<string, never>>;
type RuleWithProduct = DbRule & {
  product: { id: string; masterSku: string; name: string } | null;
};

async function enrichWithProduct(rules: DbRule[]): Promise<RuleWithProduct[]> {
  const productIds = [...new Set(rules.map((r) => r.productId).filter(Boolean))] as string[];
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, masterSku: true, name: true },
        })
      : [];
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
  return rules.map((r) => ({
    ...r,
    product: r.productId ? (productMap[r.productId] ?? null) : null,
  }));
}

export async function getPackagingRules(companyId: string, params: SearchPackagingRulesInput) {
  const { query, productId, page, limit } = params;
  const skip = (page - 1) * limit;

  const where: Prisma.PackagingRuleWhereInput = {
    companyId,
    ...(productId && { productId }),
    ...(query && {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { boxCode: { contains: query, mode: "insensitive" } },
      ],
    }),
  };

  const [rawData, total] = await Promise.all([
    prisma.packagingRule.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ productId: "asc" }, { minQty: "asc" }],
    }),
    prisma.packagingRule.count({ where }),
  ]);

  const data = await enrichWithProduct(rawData);
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPackagingRuleById(companyId: string, id: string) {
  const rule = await prisma.packagingRule.findFirst({ where: { id, companyId } });
  if (!rule) return null;
  const [enriched] = await enrichWithProduct([rule]);
  return enriched;
}

export async function createPackagingRule(companyId: string, input: CreatePackagingRuleInput) {
  const rule = await prisma.packagingRule.create({ data: { ...input, companyId } });
  const [enriched] = await enrichWithProduct([rule]);
  return enriched;
}

export async function updatePackagingRule(companyId: string, id: string, input: UpdatePackagingRuleInput) {
  const rule = await prisma.packagingRule.update({ where: { id, companyId }, data: input });
  const [enriched] = await enrichWithProduct([rule]);
  return enriched;
}

export async function deletePackagingRule(companyId: string, id: string) {
  return prisma.packagingRule.delete({ where: { id, companyId } });
}

export async function recommendPackaging(companyId: string, input: RecommendPackagingInput) {
  const { productId, quantity } = input;

  const rules = await prisma.packagingRule.findMany({
    where: {
      companyId,
      OR: [{ productId }, { productId: null }],
    },
    orderBy: [{ productId: "desc" }, { minQty: "asc" }],
  });

  const productRules = rules.filter((r) => r.productId === productId);
  const globalRules = rules.filter((r) => r.productId === null);

  function findMatch(candidates: DbRule[]) {
    return candidates.find((r) => {
      const minOk = r.minQty === null || quantity >= r.minQty;
      const maxOk = r.maxQty === null || quantity <= r.maxQty;
      return minOk && maxOk;
    });
  }

  const match = findMatch(productRules) ?? findMatch(globalRules);
  if (!match) return null;

  const [enriched] = await enrichWithProduct([match]);
  return enriched;
}
