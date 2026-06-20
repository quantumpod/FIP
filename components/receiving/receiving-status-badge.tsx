import { Badge } from "@/components/ui/badge";
import type { ReceivingStatus } from "@/types/warehouse-ops";

const config: Record<ReceivingStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-zinc-800 text-zinc-300 border-zinc-700" },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-950 text-amber-300 border-amber-800" },
  COMPLETED: { label: "Completed", className: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  CANCELLED: { label: "Cancelled", className: "bg-red-950 text-red-300 border-red-800" },
};

export function ReceivingStatusBadge({ status }: { status: ReceivingStatus }) {
  const { label, className } = config[status] ?? config.PENDING;
  return <Badge className={`border text-xs ${className}`}>{label}</Badge>;
}
