import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCycleCountById, completeCycleCount } from "@/lib/services/cycle-count.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id } = await params;
  const count = await getCycleCountById(companyId, id);
  if (!count) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(count);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id } = await params;
  const body = await req.json();
  if (body.action === "complete") {
    try {
      const count = await completeCycleCount(companyId, id);
      return NextResponse.json(count);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
