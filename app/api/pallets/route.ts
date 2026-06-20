import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createPalletSchema } from "@/lib/validations/warehouse-ops";
import { getPallets, createPallet } from "@/lib/services/pallet.service";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(3).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const sp = req.nextUrl.searchParams;
  const parsed = searchSchema.safeParse(Object.fromEntries(sp));
  if (!parsed.success) return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  return NextResponse.json(await getPallets(companyId, parsed.data));
}

export async function POST(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const body = await req.json();
  const parsed = createPalletSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const pallet = await createPallet(companyId, parsed.data);
    return NextResponse.json(pallet, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
