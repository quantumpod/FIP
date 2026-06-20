import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updatePutawayTaskItem } from "@/lib/services/putaway.service";
import { updatePutawayItemSchema } from "@/lib/validations/warehouse-ops";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id, itemId } = await params;
  const body = await req.json();
  const parsed = updatePutawayItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const item = await updatePutawayTaskItem(companyId, id, itemId, parsed.data.putawayQty);
    return NextResponse.json(item);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
