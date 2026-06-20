import { Badge } from "@/components/ui/badge";
import type { ConnectorStatus } from "@/types/integrations";

const config: Record<ConnectorStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  INACTIVE: { label: "Inactive", className: "bg-zinc-800 text-zinc-300 border-zinc-700" },
  ERROR: { label: "Error", className: "bg-red-950 text-red-300 border-red-800" },
};

export function ConnectorStatusBadge({ status }: { status: ConnectorStatus }) {
  const { label, className } = config[status] ?? config.INACTIVE;
  return <Badge className={`border text-xs ${className}`}>{label}</Badge>;
}
