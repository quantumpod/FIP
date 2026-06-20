import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updatePickTaskItem } from "@/lib/services/pick-task.service";
import { updatePickTaskItemSchema } from "@/lib/validations/pick-task";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id, itemId } = await params;
  const body = await req.json();
  const parsed = updatePickTaskItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const item = await updatePickTaskItem(companyId, id, itemId, parsed.data);
    return NextResponse.json(item);
  } catch (err: unknown) {
    const e = err as { message?: string };
    if (e.message === "NOT_FOUND") return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ error: "Failed to update item." }, { status: 500 });
  }
}
