import { Badge } from "@/components/ui/badge";
import type { ProductStatus } from "@/types/product";

const config: Record<ProductStatus, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
  INACTIVE: { label: "Inactive", className: "text-zinc-400 border-zinc-400/30 bg-zinc-400/10" },
  DRAFT: { label: "Draft", className: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
};

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const { label, className } = config[status] ?? config.DRAFT;
  return (
    <Badge variant="outline" className={`text-xs ${className}`}>
      {label}
    </Badge>
  );
}
