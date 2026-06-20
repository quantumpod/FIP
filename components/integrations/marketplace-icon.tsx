import type { Marketplace } from "@/types/listing";

const colors: Record<Marketplace, string> = {
  AMAZON: "bg-orange-500",
  WALMART: "bg-blue-600",
  EBAY: "bg-yellow-500",
  SHOPIFY: "bg-emerald-600",
  VEEQO: "bg-purple-600",
  MANUAL: "bg-zinc-600",
};

const initials: Record<Marketplace, string> = {
  AMAZON: "AMZ",
  WALMART: "WMT",
  EBAY: "eBay",
  SHOPIFY: "SHO",
  VEEQO: "VEE",
  MANUAL: "MNL",
};

export function MarketplaceIcon({ marketplace, size = "md" }: { marketplace: Marketplace; size?: "sm" | "md" | "lg" }) {
  const sz = size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-12 w-12 text-sm" : "h-9 w-9 text-xs";
  return (
    <div className={`${sz} ${colors[marketplace] ?? "bg-zinc-600"} rounded-md flex items-center justify-center font-bold text-white shrink-0`}>
      {initials[marketplace]}
    </div>
  );
}
