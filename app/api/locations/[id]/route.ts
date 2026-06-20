import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getLocationById, updateLocation, deleteLocation } from "@/lib/services/location.service";
import { updateLocationSchema } from "@/lib/validations/inventory";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  const location = await getLocationById(companyId, id);
  if (!location) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(location);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const location = await updateLocation(companyId, id, parsed.data);
    return NextResponse.json(location);
  } catch (err: unknown) {
    const e = err as { message?: string };
    if (e.message === "NOT_FOUND") return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ error: "Failed to update location." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  try {
    await deleteLocation(companyId, id);
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const e = err as { message?: string };
    if (e.message === "NOT_FOUND") return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ error: "Failed to delete location." }, { status: 500 });
  }
}
