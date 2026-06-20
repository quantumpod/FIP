import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/types/order";

const config: Record<OrderStatus, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
  READY_TO_PICK: { label: "Ready to Pick", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  PICKING: { label: "Picking", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  PACKED: { label: "Packed", className: "bg-violet-500/15 text-violet-400 border-violet-500/30" },
  SHIPPED: { label: "Shipped", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  CANCELLED: { label: "Cancelled", className: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = config[status] ?? { label: status, className: "" };
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
