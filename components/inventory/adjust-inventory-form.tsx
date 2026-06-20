"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import type { InventoryItem } from "@/types/inventory";

interface Product { id: string; masterSku: string; name: string }
interface Location { id: string; code: string }

interface AdjustInventoryFormProps {
  item?: InventoryItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AdjustInventoryForm({ item, onSuccess, onCancel }: AdjustInventoryFormProps) {
  const isEdit = !!item;
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [productId, setProductId] = useState(item?.productId ?? "");
  const [locationId, setLocationId] = useState(item?.locationId ?? "");
  const [onHand, setOnHand] = useState(item?.onHand?.toString() ?? "0");
  const [allocated, setAllocated] = useState(item?.allocated?.toString() ?? "0");
  const [lotNumber, setLotNumber] = useState(item?.lotNumber ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/products?limit=100").then((r) => r.json()),
      fetch("/api/locations?limit=100").then((r) => r.json()),
    ])
      .then(([p, l]) => {
        setProducts(p.data ?? []);
        setLocations(l.data ?? []);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      productId,
      locationId,
      onHand: parseInt(onHand) || 0,
      allocated: parseInt(allocated) || 0,
      lotNumber: lotNumber || undefined,
    };

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong.");
        return;
      }
      onSuccess?.();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Product <span className="text-destructive">*</span>
        </label>
        <Select value={productId} onValueChange={(v) => setProductId(v ?? "")} disabled={isEdit}>
          <SelectTrigger>
            <SelectValue placeholder="Select product..." />
          </SelectTrigger>
          <SelectContent>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.masterSku} — {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Location <span className="text-destructive">*</span>
        </label>
        <Select value={locationId} onValueChange={(v) => setLocationId(v ?? "")} disabled={isEdit}>
          <SelectTrigger>
            <SelectValue placeholder="Select location..." />
          </SelectTrigger>
          <SelectContent>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="onHand">On Hand</label>
          <Input id="onHand" type="number" min="0" value={onHand} onChange={(e) => setOnHand(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="allocated">Allocated</label>
          <Input id="allocated" type="number" min="0" value={allocated} onChange={(e) => setAllocated(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="lotNumber">Lot Number</label>
        <Input
          id="lotNumber"
          value={lotNumber}
          onChange={(e) => setLotNumber(e.target.value)}
          placeholder="Optional lot / batch number"
          disabled={isEdit}
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading || !productId || !locationId}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : "Save Stock"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
