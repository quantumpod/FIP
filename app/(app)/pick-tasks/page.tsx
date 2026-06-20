import { PickTasksTable } from "@/components/pick-tasks/pick-tasks-table";

export default function PickTasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Pick Tasks</h2>
        <p className="text-muted-foreground text-sm">
          Generate and manage warehouse pick tasks
        </p>
      </div>
      <PickTasksTable />
    </div>
  );
}
