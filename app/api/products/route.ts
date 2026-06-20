import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getProducts, createProduct } from "@/lib/services/product.service";
import { searchProductsSchema, createProductSchema } from "@/lib/validations/product";

export async function GET(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const parsed = searchProductsSchema.safeParse({
    query: searchParams.get("query") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getProducts(companyId!, parsed.data);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error) return error;

  const body = await req.json();
  const parsed = createProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const product = await createProduct(companyId!, parsed.data);
    return NextResponse.json(product, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "A product with this Master SKU already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
