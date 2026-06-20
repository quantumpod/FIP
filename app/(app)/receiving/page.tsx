import { ReceivingTable } from "@/components/receiving/receiving-table";

export default function ReceivingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Receiving</h2>
        <p className="text-muted-foreground text-sm">Manage inbound purchase orders and ASNs</p>
      </div>
      <ReceivingTable />
    </div>
  );
}
