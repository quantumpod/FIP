import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getWebhookLogs } from "@/lib/services/integrations.service";

export async function GET(req: NextRequest) {
  const { companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  const sp = req.nextUrl.searchParams;
  const page = Number(sp.get("page") ?? 1);
  const limit = Number(sp.get("limit") ?? 20);
  const connectionId = sp.get("connectionId") ?? undefined;
  return NextResponse.json(await getWebhookLogs(companyId, { connectionId, page, limit }));
}
