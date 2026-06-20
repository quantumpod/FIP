import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function getAuthSession() {
  const session = await auth();
  return session;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const companyId = (session.user as { companyId?: string }).companyId;
  if (!companyId) {
    return {
      session: null,
      error: NextResponse.json({ error: "No company associated" }, { status: 403 }),
    };
  }
  return { session, companyId, error: null };
}
