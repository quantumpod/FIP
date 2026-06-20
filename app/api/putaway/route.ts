import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createPutawayTaskSchema } from "@/lib/validations/warehouse-ops";
import { getPutawayTasks, generatePutawayTask } from "@/lib/services/putaway.service";
import { z } from "zod";

const searchSchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function GET(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const sp = req.nextUrl.searchParams;
  const parsed = searchSchema.safeParse(Object.fromEntries(sp));
  if (!parsed.success) return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  const result = await getPutawayTasks(companyId, parsed.data);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const body = await req.json();
  const parsed = createPutawayTaskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const task = await generatePutawayTask(companyId, parsed.data.receivingOrderId);
    return NextResponse.json(task, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
