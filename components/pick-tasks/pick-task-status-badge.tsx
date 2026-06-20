import { Badge } from "@/components/ui/badge";
import type { PickTaskStatus } from "@/types/pick-task";

const config: Record<PickTaskStatus, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  IN_PROGRESS: { label: "In Progress", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  COMPLETED: { label: "Completed", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  CANCELLED: { label: "Cancelled", className: "bg-red-500/15 text-red-400 border-red-500/30" },
};

export function PickTaskStatusBadge({ status }: { status: PickTaskStatus }) {
  const { label, className } = config[status] ?? { label: status, className: "" };
  return <Badge variant="outline" className={className}>{label}</Badge>;
}
