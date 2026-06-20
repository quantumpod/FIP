import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getListings, createListing } from "@/lib/services/listing.service";
import { searchListingsSchema, createListingSchema } from "@/lib/validations/listing";

export async function GET(req: NextRequest) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { searchParams } = req.nextUrl;
  const parsed = searchListingsSchema.safeParse({
    query: searchParams.get("query") ?? undefined,
    marketplace: searchParams.get("marketplace") ?? undefined,
    productId: searchParams.get("productId") ?? undefined,
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query params", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getListings(companyId, parsed.data);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const body = await req.json();
  const parsed = createListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const listing = await createListing(companyId, parsed.data);
    return NextResponse.json(listing, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json({ error: "A listing with this Seller SKU already exists for this product." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create listing." }, { status: 500 });
  }
}
