"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Warehouse { id: string; name: string; code: string; }
interface Location { id: string; code: string; warehouseId: string; }

export function CycleCountForm({ onSuccess }: { onSuccess: () => void }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/warehouses").then(r => r.json()).then(setWarehouses).catch(() => {});
  }, []);

  useEffect(() => {
    if (!warehouseId) return;
    fetch(`/api/locations?warehouseId=${warehouseId}&limit=200`)
      .then(r => r.json())
      .then(d => setLocations(d.data ?? []))
      .catch(() => {});
  }, [warehouseId]);

  function toggleLocation(id: string) {
    setSelectedLocations(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!warehouseId || selectedLocations.length === 0) {
      toast.error("Select a warehouse and at least one location");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/cycle-counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouseId, locationIds: selectedLocations, notes: notes || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success("Cycle count created");
      onSuccess();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  const warehouseLocations = locations.filter(l => l.warehouseId === warehouseId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Warehouse *</Label>
        <Select value={warehouseId} onValueChange={(v) => { setWarehouseId(v ?? ""); setSelectedLocations([]); }}>
          <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
          <SelectContent>
            {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.code} — {w.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {warehouseLocations.length > 0 && (
        <div className="space-y-1.5">
          <Label>Locations to Count *</Label>
          <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto rounded-md border border-border/50 p-2">
            {warehouseLocations.map(loc => (
              <label key={loc.id} className="flex items-center gap-2 cursor-pointer rounded px-2 py-1 hover:bg-muted/30 text-sm">
                <input
                  type="checkbox"
                  checked={selectedLocations.includes(loc.id)}
                  onChange={() => toggleLocation(loc.id)}
                  className="rounded"
                />
                <span className="font-mono">{loc.code}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{selectedLocations.length} selected</p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" rows={2} />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Start Cycle Count
        </Button>
      </div>
    </form>
  );
}
