import { ProductsTable } from "@/components/products/products-table";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        <p className="text-muted-foreground text-sm">
          Manage master SKUs and product catalog
        </p>
      </div>
      <ProductsTable />
    </div>
  );
}
