import { Badge } from "@/components/ui/badge";
import type { Marketplace } from "@/types/listing";

const config: Record<Marketplace, { label: string; className: string }> = {
  AMAZON: { label: "Amazon", className: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  WALMART: { label: "Walmart", className: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  EBAY: { label: "eBay", className: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  SHOPIFY: { label: "Shopify", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  VEEQO: { label: "Veeqo", className: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  MANUAL: { label: "Manual", className: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
};

export function MarketplaceBadge({ marketplace }: { marketplace: Marketplace }) {
  const { label, className } = config[marketplace] ?? { label: marketplace, className: "" };
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
