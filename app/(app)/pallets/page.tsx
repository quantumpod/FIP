import { PalletsTable } from "@/components/pallets/pallets-table";

export default function PalletsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pallets</h2>
        <p className="text-muted-foreground text-sm">Track pallet contents and locations</p>
      </div>
      <PalletsTable />
    </div>
  );
}
