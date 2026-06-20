import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getLocations, createLocation } from "@/lib/services/location.service";
import { searchLocationsSchema, createLocationSchema } from "@/lib/validations/inventory";

export async function GET(req: NextRequest) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { searchParams } = req.nextUrl;
  const parsed = searchLocationsSchema.safeParse({
    query: searchParams.get("query") ?? undefined,
    warehouseId: searchParams.get("warehouseId") ?? undefined,
    isActive: searchParams.get("isActive") ?? undefined,
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid params", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getLocations(companyId, parsed.data);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const body = await req.json();
  const parsed = createLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const location = await createLocation(companyId, parsed.data);
    return NextResponse.json(location, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.message === "WAREHOUSE_NOT_FOUND") return NextResponse.json({ error: "Warehouse not found." }, { status: 404 });
    if (e.code === "P2002") return NextResponse.json({ error: "Location code already exists in this warehouse." }, { status: 409 });
    return NextResponse.json({ error: "Failed to create location." }, { status: 500 });
  }
}
