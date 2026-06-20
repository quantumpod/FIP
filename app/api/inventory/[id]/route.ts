import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getInventoryById, deleteInventoryItem } from "@/lib/services/inventory.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  const item = await getInventoryById(companyId, id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  try {
    await deleteInventoryItem(companyId, id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Failed to delete inventory item." }, { status: 500 });
  }
}
