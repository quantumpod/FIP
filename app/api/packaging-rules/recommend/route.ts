import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { recommendPackaging } from "@/lib/services/packaging.service";
import { recommendPackagingSchema } from "@/lib/validations/packaging";

export async function GET(req: NextRequest) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { searchParams } = req.nextUrl;
  const parsed = recommendPackagingSchema.safeParse({
    productId: searchParams.get("productId"),
    quantity: searchParams.get("quantity"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "productId and quantity are required." }, { status: 400 });
  }

  const rule = await recommendPackaging(companyId, parsed.data);
  if (!rule) {
    return NextResponse.json({ error: "No packaging rule found for this product and quantity." }, { status: 404 });
  }

  return NextResponse.json(rule);
}
