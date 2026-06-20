import { PutawayTable } from "@/components/putaway/putaway-table";

export default function PutawayPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Putaway</h2>
        <p className="text-muted-foreground text-sm">Direct received inventory to warehouse locations</p>
      </div>
      <PutawayTable />
    </div>
  );
}
