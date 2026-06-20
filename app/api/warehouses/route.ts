import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const warehouses = await prisma.warehouse.findMany({
    where: { companyId },
    orderBy: { code: "asc" },
    select: { id: true, name: true, code: true },
  });

  return NextResponse.json(warehouses);
}
