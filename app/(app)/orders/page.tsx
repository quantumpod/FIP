import { OrdersTable } from "@/components/orders/orders-table";

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
        <p className="text-muted-foreground text-sm">
          View and manage marketplace orders
        </p>
      </div>
      <OrdersTable />
    </div>
  );
}
