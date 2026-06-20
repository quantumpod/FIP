"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Warehouse { id: string; name: string; code: string; }
interface Product { id: string; masterSku: string; name: string; }

interface Props {
  onSuccess: () => void;
}

interface LineItem {
  productId: string;
  expectedQty: number;
  lotNumber: string;
}

export function ReceivingForm({ onSuccess }: Props) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ productId: "", expectedQty: 1, lotNumber: "" }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/warehouses").then(r => r.json()).then(setWarehouses).catch(() => {});
    fetch("/api/products?limit=200").then(r => r.json()).then((d) => setProducts(d.data ?? [])).catch(() => {});
  }, []);

  function addItem() {
    setItems(prev => [...prev, { productId: "", expectedQty: 1, lotNumber: "" }]);
  }

  function removeItem(i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i));
  }

  function updateItem(i: number, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!warehouseId || !poNumber || items.some(i => !i.productId)) {
      toast.error("Fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/receiving", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseId,
          poNumber,
          supplier: supplier || undefined,
          items: items.map(i => ({
            productId: i.productId,
            expectedQty: Number(i.expectedQty),
            lotNumber: i.lotNumber || undefined,
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error");
      }
      toast.success("Receiving order created");
      onSuccess();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Warehouse *</Label>
          <Select value={warehouseId} onValueChange={(v) => setWarehouseId(v ?? "")}>
            <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
            <SelectContent>
              {warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.code} — {w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>PO Number *</Label>
          <Input value={poNumber} onChange={e => setPoNumber(e.target.value)} placeholder="PO-2024-001" />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label>Supplier</Label>
          <Input value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Supplier name" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Items *</Label>
          <Button type="button" size="sm" variant="ghost" onClick={addItem} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Add Item
          </Button>
        </div>
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_100px_120px_auto] gap-2 items-end">
            <div>
              {i === 0 && <Label className="text-xs text-muted-foreground mb-1 block">Product</Label>}
              <Select value={item.productId} onValueChange={(v) => updateItem(i, "productId", v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.masterSku} — {p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              {i === 0 && <Label className="text-xs text-muted-foreground mb-1 block">Qty</Label>}
              <Input
                type="number"
                min={1}
                value={item.expectedQty}
                onChange={e => updateItem(i, "expectedQty", Number(e.target.value))}
              />
            </div>
            <div>
              {i === 0 && <Label className="text-xs text-muted-foreground mb-1 block">Lot #</Label>}
              <Input
                value={item.lotNumber}
                onChange={e => updateItem(i, "lotNumber", e.target.value)}
                placeholder="Optional"
              />
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => removeItem(i)}
              disabled={items.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Create Receiving Order
        </Button>
      </div>
    </form>
  );
}
