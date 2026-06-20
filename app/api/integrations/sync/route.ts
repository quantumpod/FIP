import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSyncJobs, triggerSync } from "@/lib/services/integrations.service";
import { z } from "zod";

const triggerSchema = z.object({
  connectionId: z.string().min(1),
  type: z.enum(["ORDERS", "INVENTORY", "LISTINGS", "PRODUCTS"]),
});

export async function GET(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const sp = req.nextUrl.searchParams;
  const page = Number(sp.get("page") ?? 1);
  const limit = Number(sp.get("limit") ?? 20);
  const connectionId = sp.get("connectionId") ?? undefined;
  return NextResponse.json(await getSyncJobs(companyId, { connectionId, page, limit }));
}

export async function POST(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const body = await req.json();
  const parsed = triggerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const job = await triggerSync(companyId, parsed.data.connectionId, parsed.data.type);
    return NextResponse.json(job, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
