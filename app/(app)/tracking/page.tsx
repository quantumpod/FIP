import { TrackingLookup } from "@/components/orders/tracking-lookup";

export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tracking Lookup</h2>
        <p className="text-muted-foreground text-sm">
          Search orders by tracking number
        </p>
      </div>
      <TrackingLookup />
    </div>
  );
}
