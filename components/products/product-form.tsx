"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import type { Product } from "@/types/product";

interface ProductFormProps {
  product?: Product;
  onSuccess?: () => void;
}

interface FormState {
  masterSku: string;
  name: string;
  description: string;
  barcode: string;
  upc: string;
  brand: string;
  status: string;
  length: string;
  width: string;
  height: string;
  weight: string;
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [form, setForm] = useState<FormState>({
    masterSku: product?.masterSku ?? "",
    name: product?.name ?? "",
    description: product?.description ?? "",
    barcode: product?.barcode ?? "",
    upc: product?.upc ?? "",
    brand: product?.brand ?? "",
    status: product?.status ?? "ACTIVE",
    length: product?.length?.toString() ?? "",
    width: product?.width?.toString() ?? "",
    height: product?.height?.toString() ?? "",
    weight: product?.weight?.toString() ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      masterSku: form.masterSku,
      name: form.name,
      description: form.description || undefined,
      barcode: form.barcode || undefined,
      upc: form.upc || undefined,
      brand: form.brand || undefined,
      status: form.status,
      length: form.length ? parseFloat(form.length) : undefined,
      width: form.width ? parseFloat(form.width) : undefined,
      height: form.height ? parseFloat(form.height) : undefined,
      weight: form.weight ? parseFloat(form.weight) : undefined,
    };

    try {
      const url = isEdit ? `/api/products/${product.id}` : "/api/products";
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

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/products");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="masterSku">
            Master SKU <span className="text-destructive">*</span>
          </label>
          <Input
            id="masterSku"
            value={form.masterSku}
            onChange={set("masterSku")}
            placeholder="WH-AA"
            required
            disabled={isEdit}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="name">
            Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            value={form.name}
            onChange={set("name")}
            placeholder="Widget Alpha"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="brand">
            Brand
          </label>
          <Input
            id="brand"
            value={form.brand}
            onChange={set("brand")}
            placeholder="Brand name"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((p) => ({ ...p, status: v ?? "ACTIVE" }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="barcode">
            Barcode
          </label>
          <Input
            id="barcode"
            value={form.barcode}
            onChange={set("barcode")}
            placeholder="123456789"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="upc">
            UPC
          </label>
          <Input
            id="upc"
            value={form.upc}
            onChange={set("upc")}
            placeholder="012345678901"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="description">
          Description
        </label>
        <Textarea
          id="description"
          value={form.description}
          onChange={set("description")}
          placeholder="Product description..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          Dimensions & Weight
        </p>
        <div className="grid gap-3 sm:grid-cols-4">
          {(["length", "width", "height", "weight"] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <label className="text-xs font-medium capitalize text-muted-foreground" htmlFor={field}>
                {field} {field === "weight" ? "(lb)" : "(in)"}
              </label>
              <Input
                id={field}
                type="number"
                step="0.01"
                min="0"
                value={form[field]}
                onChange={set(field)}
                placeholder="0.00"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEdit ? "Saving..." : "Creating..."}
            </>
          ) : isEdit ? (
            "Save Changes"
          ) : (
            "Create Product"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/products")}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
