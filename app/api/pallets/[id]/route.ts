import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPalletById, updatePallet, addPalletItem, removePalletItem, deletePallet } from "@/lib/services/pallet.service";
import { addPalletItemSchema } from "@/lib/validations/warehouse-ops";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id } = await params;
  const pallet = await getPalletById(companyId, id);
  if (!pallet) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(pallet);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id } = await params;
  const body = await req.json();

  if (body.action === "addItem") {
    const parsed = addPalletItemSchema.safeParse(body.item);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    try {
      return NextResponse.json(await addPalletItem(companyId, id, parsed.data));
    } catch (e: unknown) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  if (body.action === "removeItem") {
    try {
      return NextResponse.json(await removePalletItem(companyId, id, body.itemId));
    } catch (e: unknown) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  try {
    return NextResponse.json(await updatePallet(companyId, id, { locationId: body.locationId, isSealed: body.isSealed, notes: body.notes }));
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id } = await params;
  try {
    await deletePallet(companyId, id);
    return new Response(null, { status: 204 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
