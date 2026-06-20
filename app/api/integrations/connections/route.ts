import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getConnections, createConnection } from "@/lib/services/integrations.service";
import { z } from "zod";

const createSchema = z.object({
  marketplace: z.enum(["AMAZON", "WALMART", "EBAY", "SHOPIFY", "VEEQO"]),
  name: z.string().min(1).max(100),
  credentials: z.record(z.string(), z.string()).optional(),
  settings: z.record(z.string(), z.string()).optional(),
});

export async function GET() {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  return NextResponse.json(await getConnections(companyId));
}

export async function POST(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const conn = await createConnection(companyId, parsed.data);
    return NextResponse.json(conn, { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
