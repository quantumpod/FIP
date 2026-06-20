import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOrders, createOrder } from "@/lib/services/order.service";
import { searchOrdersSchema, createOrderSchema } from "@/lib/validations/order";

export async function GET(req: NextRequest) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { searchParams } = req.nextUrl;
  const parsed = searchOrdersSchema.safeParse({
    query: searchParams.get("query") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    marketplace: searchParams.get("marketplace") ?? undefined,
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid params", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getOrders(companyId, parsed.data);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const body = await req.json();
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const order = await createOrder(companyId, parsed.data);
    return NextResponse.json(order, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Order number already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
  }
}
