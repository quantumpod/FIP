import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createReceivingOrderSchema, searchReceivingSchema } from "@/lib/validations/warehouse-ops";
import { createReceivingOrder, getReceivingOrders } from "@/lib/services/receiving.service";

export async function GET(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;

  const sp = req.nextUrl.searchParams;
  const parsed = searchReceivingSchema.safeParse(Object.fromEntries(sp));
  if (!parsed.success) return NextResponse.json({ error: "Invalid params" }, { status: 400 });

  const result = await getReceivingOrders(companyId, parsed.data);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;

  const body = await req.json();
  const parsed = createReceivingOrderSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const order = await createReceivingOrder(companyId, parsed.data);
    return NextResponse.json(order, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
