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
import { Loader2, Box, CheckCircle2, AlertCircle } from "lucide-react";
import type { PackagingRule } from "@/types/packaging";

interface Product { id: string; masterSku: string; name: string }

export function PackagingRecommender() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PackagingRule | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((d) => setProducts(d.data ?? []))
      .catch(() => {});
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !quantity) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/packaging-rules/recommend?productId=${productId}&quantity=${quantity}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No rule found.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Product</label>
          <Select value={productId} onValueChange={(v) => { setProductId(v ?? ""); setResult(null); setError(null); }}>
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
          <label className="text-sm font-medium" htmlFor="qty">Quantity</label>
          <Input
            id="qty"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => { setQuantity(e.target.value); setResult(null); setError(null); }}
            placeholder="32"
            required
          />
        </div>

        <Button type="submit" disabled={loading || !productId || !quantity} className="w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Box className="h-4 w-4" />}
          Find Box
        </Button>
      </form>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            Recommended Box
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Box Code</span>
              <span className="font-mono text-lg font-bold">{result.boxCode}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Name</span>
              <span className="text-sm">{result.name}</span>
            </div>
            {(result.minQty || result.maxQty) && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Qty Range</span>
                <span className="text-sm tabular-nums">{result.minQty ?? "—"} – {result.maxQty ?? "∞"}</span>
              </div>
            )}
            {result.length && result.width && result.height && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Dimensions</span>
                <span className="text-sm tabular-nums">{result.length}" × {result.width}" × {result.height}"</span>
              </div>
            )}
            {result.weightLimit && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Max Weight</span>
                <span className="text-sm tabular-nums">{result.weightLimit} lb</span>
              </div>
            )}
            {result.product && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Scope</span>
                <span className="font-mono text-xs">{result.product.masterSku}</span>
              </div>
            )}
            {!result.product && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Scope</span>
                <span className="text-xs text-muted-foreground">Global rule</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
