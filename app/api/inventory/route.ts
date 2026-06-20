import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getInventory, adjustInventory } from "@/lib/services/inventory.service";
import { searchInventorySchema, adjustInventorySchema } from "@/lib/validations/inventory";

export async function GET(req: NextRequest) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { searchParams } = req.nextUrl;
  const parsed = searchInventorySchema.safeParse({
    query: searchParams.get("query") ?? undefined,
    locationId: searchParams.get("locationId") ?? undefined,
    productId: searchParams.get("productId") ?? undefined,
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid params", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getInventory(companyId, parsed.data);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const body = await req.json();
  const parsed = adjustInventorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const item = await adjustInventory(companyId, parsed.data);
    return NextResponse.json(item, { status: 201 });
  } catch (err: unknown) {
    const e = err as { message?: string };
    if (e.message === "PRODUCT_NOT_FOUND") return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (e.message === "LOCATION_NOT_FOUND") return NextResponse.json({ error: "Location not found." }, { status: 404 });
    return NextResponse.json({ error: "Failed to adjust inventory." }, { status: 500 });
  }
}
