import { InventoryTable } from "@/components/inventory/inventory-table";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
        <p className="text-muted-foreground text-sm">
          Track stock levels by location
        </p>
      </div>
      <InventoryTable />
    </div>
  );
}
