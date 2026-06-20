import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPutawayTaskById, updatePutawayTask, updatePutawayTaskItem } from "@/lib/services/putaway.service";
import { updatePutawayItemSchema } from "@/lib/validations/warehouse-ops";
import { z } from "zod";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id } = await params;
  const task = await getPutawayTaskById(companyId, id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id } = await params;
  const body = await req.json();

  try {
    const task = await updatePutawayTask(companyId, id, body.status);
    return NextResponse.json(task);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
