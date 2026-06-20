"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Warehouse { id: string; name: string; code: string; }

export function PalletForm({ onSuccess }: { onSuccess: () => void }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/warehouses").then(r => r.json()).then(setWarehouses).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!warehouseId || !code) { toast.error("Fill all required fields"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/pallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouseId, code }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success("Pallet created");
      onSuccess();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Warehouse *</Label>
        <Select value={warehouseId} onValueChange={v => setWarehouseId(v ?? "")}>
          <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
          <SelectContent>
            {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.code} — {w.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Pallet Code *</Label>
        <Input value={code} onChange={e => setCode(e.target.value)} placeholder="PLT-001" className="font-mono" />
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Create Pallet
        </Button>
      </div>
    </form>
  );
}
