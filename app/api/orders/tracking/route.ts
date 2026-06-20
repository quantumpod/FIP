import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getOrderByTracking } from "@/lib/services/order.service";

export async function GET(req: NextRequest) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const trackingNumber = req.nextUrl.searchParams.get("number");
  if (!trackingNumber || trackingNumber.trim().length < 3) {
    return NextResponse.json({ error: "Tracking number is required (min 3 chars)." }, { status: 400 });
  }

  const order = await getOrderByTracking(companyId, trackingNumber.trim());
  if (!order) {
    return NextResponse.json({ error: "No order found for this tracking number." }, { status: 404 });
  }

  return NextResponse.json(order);
}
