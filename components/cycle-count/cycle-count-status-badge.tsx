import { Badge } from "@/components/ui/badge";
import type { CycleCountStatus } from "@/types/warehouse-ops";

const config: Record<CycleCountStatus, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-zinc-800 text-zinc-300 border-zinc-700" },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-950 text-amber-300 border-amber-800" },
  COMPLETED: { label: "Completed", className: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  CANCELLED: { label: "Cancelled", className: "bg-red-950 text-red-300 border-red-800" },
};

export function CycleCountStatusBadge({ status }: { status: CycleCountStatus }) {
  const { label, className } = config[status] ?? config.OPEN;
  return <Badge className={`border text-xs ${className}`}>{label}</Badge>;
}
