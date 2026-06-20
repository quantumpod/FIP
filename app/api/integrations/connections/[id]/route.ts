import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getConnectionById,
  updateConnection,
  deleteConnection,
} from "@/lib/services/integrations.service";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ERROR"]).optional(),
  credentials: z.record(z.string(), z.string()).optional(),
  settings: z.record(z.string(), z.string()).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id } = await params;
  const conn = await getConnectionById(companyId, id);
  if (!conn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(conn);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    return NextResponse.json(await updateConnection(companyId, id, parsed.data));
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const { id } = await params;
  try {
    await deleteConnection(companyId, id);
    return new Response(null, { status: 204 });
  } catch (e: unknown) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
