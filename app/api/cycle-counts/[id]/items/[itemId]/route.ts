import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { submitCycleCountItem } from "@/lib/services/cycle-count.service";
import { submitCycleCountItemSchema } from "@/lib/validations/warehouse-ops";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id, itemId } = await params;
  const body = await req.json();
  const parsed = submitCycleCountItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const count = await submitCycleCountItem(companyId, id, itemId, parsed.data.countedQty);
    return NextResponse.json(count);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
