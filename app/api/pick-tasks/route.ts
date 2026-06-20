import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPickTasks, generatePickTask } from "@/lib/services/pick-task.service";
import { searchPickTasksSchema, generatePickTaskSchema } from "@/lib/validations/pick-task";

export async function GET(req: NextRequest) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const { searchParams } = req.nextUrl;
  const parsed = searchPickTasksSchema.safeParse({
    query: searchParams.get("query") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    page: searchParams.get("page") ?? 1,
    limit: searchParams.get("limit") ?? 20,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid params", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await getPickTasks(companyId, parsed.data);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { session, companyId, error } = await requireAuth();
  if (error || !companyId) return error!;
  void session;

  const body = await req.json();
  const parsed = generatePickTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const task = await generatePickTask(companyId, parsed.data.orderId);
    return NextResponse.json(task, { status: 201 });
  } catch (err: unknown) {
    const e = err as { message?: string };
    if (e.message === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (e.message === "NO_INVENTORY") return NextResponse.json({ error: "No available inventory to generate pick task." }, { status: 422 });
    return NextResponse.json({ error: "Failed to generate pick task." }, { status: 500 });
  }
}
