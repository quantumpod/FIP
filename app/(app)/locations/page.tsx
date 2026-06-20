import { LocationsTable } from "@/components/inventory/locations-table";

export default function LocationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Locations</h2>
        <p className="text-muted-foreground text-sm">
          Manage warehouse zones, aisles, racks and bins
        </p>
      </div>
      <LocationsTable />
    </div>
  );
}
