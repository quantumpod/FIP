import { auth } from "@/auth";
import { getProductById } from "@/lib/services/product.service";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { ProductForm } from "@/components/products/product-form";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ProductStatus } from "@/types/product";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const companyId = (session?.user as { companyId?: string })?.companyId;
  if (!companyId) notFound();

  const { id } = await params;
  const product = await getProductById(companyId, id);
  if (!product) notFound();

  const productForForm = {
    ...product,
    length: product.length ? Number(product.length) : null,
    width: product.width ? Number(product.width) : null,
    height: product.height ? Number(product.height) : null,
    weight: product.weight ? Number(product.weight) : null,
    status: product.status as ProductStatus,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Products
        </Link>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight font-mono">
            {product.masterSku}
          </h2>
          <ProductStatusBadge status={product.status as ProductStatus} />
        </div>
        <p className="text-muted-foreground text-sm mt-1">{product.name}</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Edit Product</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm product={productForForm} />
        </CardContent>
      </Card>

      {product.listings && product.listings.length > 0 && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base">Listings ({product.listings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {product.listings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2"
                >
                  <div>
                    <span className="text-sm font-mono font-medium">{listing.sellerSku}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{listing.marketplace}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">Qty: {listing.bundleQty}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
