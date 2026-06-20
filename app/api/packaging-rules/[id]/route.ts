import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getPackagingRuleById,
  updatePackagingRule,
  deletePackagingRule,
} from "@/lib/services/packaging.service";
import { updatePackagingRuleSchema } from "@/lib/validations/packaging";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  const rule = await getPackagingRuleById(companyId, id);
  if (!rule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rule);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  const body = await req.json();
  const parsed = updatePackagingRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const rule = await updatePackagingRule(companyId, id, parsed.data);
    return NextResponse.json(rule);
  } catch {
    return NextResponse.json({ error: "Failed to update packaging rule." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { id } = await params;
  try {
    await deletePackagingRule(companyId, id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Failed to delete packaging rule." }, { status: 500 });
  }
}
