import { ListingsTable } from "@/components/listings/listings-table";

export default function ListingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Listings</h2>
        <p className="text-muted-foreground text-sm">
          Map marketplace Seller SKUs to Master SKUs
        </p>
      </div>
      <ListingsTable />
    </div>
  );
}
