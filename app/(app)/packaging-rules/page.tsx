import { PackagingRulesTable } from "@/components/packaging/packaging-rules-table";

export default function PackagingRulesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Packaging Rules</h2>
        <p className="text-muted-foreground text-sm">
          Define box recommendations by product and quantity range
        </p>
      </div>
      <PackagingRulesTable />
    </div>
  );
}
