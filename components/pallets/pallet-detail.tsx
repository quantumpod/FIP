"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Pallet } from "@/types/warehouse-ops";
import { Lock, Unlock, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Product { id: string; masterSku: string; name: string; }
interface Location { id: string; code: string; }

interface Props {
  pallet: Pallet;
  onUpdate: (updated: Pallet) => void;
  onDelete: () => void;
}

export function PalletDetail({ pallet, onUpdate, onDelete }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [lot, setLot] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/products?limit=200").then(r => r.json()).then(d => setProducts(d.data ?? [])).catch(() => {});
    fetch(`/api/locations?warehouseId=${pallet.warehouseId}&limit=200`).then(r => r.json()).then(d => setLocations(d.data ?? [])).catch(() => {});
  }, [pallet.warehouseId]);

  async function patch(body: object) {
    setSaving(true);
    try {
      const res = await fetch(`/api/pallets/${pallet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      onUpdate(await res.json());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this pallet?")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pallets/${pallet.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success("Pallet deleted");
      onDelete();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {pallet.isSealed
          ? <Badge className="bg-zinc-800 text-zinc-300 border border-zinc-700 gap-1"><Lock className="h-3 w-3" />Sealed</Badge>
          : <Badge variant="outline">Open</Badge>
        }
        <span className="text-sm text-muted-foreground">{pallet.warehouse?.code}</span>
        {pallet.location && <span className="text-sm text-muted-foreground">@ {pallet.location.code}</span>}
      </div>

      {/* Location assignment */}
      {!pallet.isSealed && (
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs">Assign Location</Label>
            <Select value={pallet.location?.id ?? ""} onValueChange={v => patch({ locationId: v || null })}>
              <SelectTrigger><SelectValue placeholder="No location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No location</SelectItem>
                {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Items ({pallet.items.length})</p>
        {pallet.items.length === 0 && (
          <p className="text-sm text-muted-foreground">No items on this pallet yet</p>
        )}
        {pallet.items.map(item => (
          <div key={item.id} className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2.5">
            <div>
              <p className="font-mono text-sm font-semibold">{item.product?.masterSku}</p>
              {item.lotNumber && <p className="text-xs text-muted-foreground">Lot: {item.lotNumber}</p>}
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular-nums text-sm">×{item.quantity}</span>
              {!pallet.isSealed && (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => patch({ action: "removeItem", itemId: item.id })}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {!pallet.isSealed && (
          <div className="grid grid-cols-[1fr_80px_100px_auto] gap-2 items-end pt-1">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Product</Label>
              <Select value={productId} onValueChange={v => setProductId(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.masterSku}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Qty</Label>
              <Input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Lot</Label>
              <Input value={lot} onChange={e => setLot(e.target.value)} placeholder="Optional" />
            </div>
            <Button size="icon" variant="outline"
              disabled={!productId || saving}
              onClick={() => {
                patch({ action: "addItem", item: { productId, quantity: qty, lotNumber: lot || undefined } });
                setProductId(""); setQty(1); setLot("");
              }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving || pallet.isSealed}>
          <Trash2 className="h-4 w-4 mr-2" /> Delete
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={saving}
          onClick={() => patch({ isSealed: !pallet.isSealed })}
        >
          {pallet.isSealed ? <><Unlock className="h-4 w-4 mr-2" />Unseal</> : <><Lock className="h-4 w-4 mr-2" />Seal Pallet</>}
        </Button>
      </div>

      {saving && <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
    </div>
  );
}
