import { CycleCountTable } from "@/components/cycle-count/cycle-count-table";

export default function CycleCountsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cycle Counts</h2>
        <p className="text-muted-foreground text-sm">Verify inventory accuracy by counting specific locations</p>
      </div>
      <CycleCountTable />
    </div>
  );
}
