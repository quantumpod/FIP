import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getListingById, updateListing, deleteListing } from "@/lib/services/listing.service";
import { updateListingSchema } from "@/lib/validations/listing";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  const listing = await getListingById(companyId, id);
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(listing);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateListingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const listing = await updateListing(companyId, id, parsed.data);
    return NextResponse.json(listing);
  } catch {
    return NextResponse.json({ error: "Failed to update listing." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  try {
    await deleteListing(companyId, id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Failed to delete listing." }, { status: 500 });
  }
}
