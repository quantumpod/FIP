import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { completeReceivingSchema } from "@/lib/validations/warehouse-ops";
import {
  getReceivingOrderById,
  receiveItems,
  cancelReceivingOrder,
} from "@/lib/services/receiving.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id } = await params;
  const order = await getReceivingOrderById(companyId, id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id } = await params;

  const body = await req.json();

  if (body.action === "cancel") {
    try {
      const order = await cancelReceivingOrder(companyId, id);
      return NextResponse.json(order);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  const parsed = completeReceivingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const order = await receiveItems(companyId, id, parsed.data.items);
    return NextResponse.json(order);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
