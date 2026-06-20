import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getProductById, updateProduct, deleteProduct } from "@/lib/services/product.service";
import { updateProductSchema } from "@/lib/validations/product";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const product = await getProductById(companyId!, id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json(product);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const body = await req.json();
  const parsed = updateProductSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await updateProduct(companyId!, id, parsed.data);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json(product);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { companyId, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const product = await deleteProduct(companyId!, id);
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
