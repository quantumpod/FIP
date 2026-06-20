import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPickTaskById, updatePickTask, deletePickTask } from "@/lib/services/pick-task.service";
import { updatePickTaskSchema } from "@/lib/validations/pick-task";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  const task = await getPickTaskById(companyId, id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  const body = await req.json();
  const parsed = updatePickTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const task = await updatePickTask(companyId, id, parsed.data);
    return NextResponse.json(task);
  } catch (err: unknown) {
    const e = err as { message?: string };
    if (e.message === "NOT_FOUND") return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ error: "Failed to update pick task." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  try {
    await deletePickTask(companyId, id);
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    const e = err as { message?: string };
    if (e.message === "NOT_FOUND") return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ error: "Failed to delete pick task." }, { status: 500 });
  }
}
