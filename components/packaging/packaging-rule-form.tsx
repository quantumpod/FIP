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
import type { PackagingRule } from "@/types/packaging";

interface Product { id: string; masterSku: string; name: string }

interface PackagingRuleFormProps {
  rule?: PackagingRule;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormState {
  name: string;
  boxCode: string;
  productId: string;
  minQty: string;
  maxQty: string;
  length: string;
  width: string;
  height: string;
  weightLimit: string;
}

export function PackagingRuleForm({ rule, onSuccess, onCancel }: PackagingRuleFormProps) {
  const isEdit = !!rule;
  const [form, setForm] = useState<FormState>({
    name: rule?.name ?? "",
    boxCode: rule?.boxCode ?? "",
    productId: rule?.productId ?? "__global__",
    minQty: rule?.minQty?.toString() ?? "",
    maxQty: rule?.maxQty?.toString() ?? "",
    length: rule?.length?.toString() ?? "",
    width: rule?.width?.toString() ?? "",
    height: rule?.height?.toString() ?? "",
    weightLimit: rule?.weightLimit?.toString() ?? "",
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((d) => setProducts(d.data ?? []))
      .catch(() => {});
  }, []);

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name: form.name,
      boxCode: form.boxCode,
      productId: form.productId === "__global__" ? undefined : form.productId || undefined,
      minQty: form.minQty ? parseInt(form.minQty) : undefined,
      maxQty: form.maxQty ? parseInt(form.maxQty) : undefined,
      length: form.length ? parseFloat(form.length) : undefined,
      width: form.width ? parseFloat(form.width) : undefined,
      height: form.height ? parseFloat(form.height) : undefined,
      weightLimit: form.weightLimit ? parseFloat(form.weightLimit) : undefined,
    };

    try {
      const url = isEdit ? `/api/packaging-rules/${rule.id}` : "/api/packaging-rules";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="name">
            Rule Name <span className="text-destructive">*</span>
          </label>
          <Input id="name" value={form.name} onChange={set("name")} placeholder="Small Box" required />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="boxCode">
            Box Code <span className="text-destructive">*</span>
          </label>
          <Input id="boxCode" value={form.boxCode} onChange={set("boxCode")} placeholder="BOX-S" required />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Product (leave blank for global rule)</label>
        <Select
          value={form.productId}
          onValueChange={(v) => setForm((p) => ({ ...p, productId: v ?? "__global__" }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Global (all products)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__global__">Global — applies to all products</SelectItem>
            {products.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.masterSku} — {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Quantity Range</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="minQty">Min Qty</label>
            <Input id="minQty" type="number" min="1" value={form.minQty} onChange={set("minQty")} placeholder="1" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="maxQty">Max Qty</label>
            <Input id="maxQty" type="number" min="1" value={form.maxQty} onChange={set("maxQty")} placeholder="50" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Box Dimensions & Weight</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {(["length", "width", "height"] as const).map((f) => (
            <div key={f} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground capitalize" htmlFor={f}>{f} (in)</label>
              <Input id={f} type="number" step="0.1" min="0" value={form[f]} onChange={set(f)} placeholder="0" />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="weightLimit">Max Weight (lb)</label>
            <Input id="weightLimit" type="number" step="0.1" min="0" value={form.weightLimit} onChange={set("weightLimit")} placeholder="0" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" />{isEdit ? "Saving..." : "Creating..."}</>
          ) : isEdit ? "Save Changes" : "Create Rule"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
