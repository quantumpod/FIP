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
import type { Listing } from "@/types/listing";

const MARKETPLACES = [
  { value: "AMAZON", label: "Amazon" },
  { value: "WALMART", label: "Walmart" },
  { value: "EBAY", label: "eBay" },
  { value: "SHOPIFY", label: "Shopify" },
  { value: "VEEQO", label: "Veeqo" },
] as const;

interface Product {
  id: string;
  masterSku: string;
  name: string;
}

interface ListingFormProps {
  listing?: Listing;
  defaultProductId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormState {
  productId: string;
  marketplace: string;
  sellerSku: string;
  asin: string;
  fnsku: string;
  externalId: string;
  bundleQty: string;
}

export function ListingForm({ listing, defaultProductId, onSuccess, onCancel }: ListingFormProps) {
  const isEdit = !!listing;

  const [form, setForm] = useState<FormState>({
    productId: listing?.productId ?? defaultProductId ?? "",
    marketplace: listing?.marketplace ?? "AMAZON",
    sellerSku: listing?.sellerSku ?? "",
    asin: listing?.asin ?? "",
    fnsku: listing?.fnsku ?? "",
    externalId: listing?.externalId ?? "",
    bundleQty: listing?.bundleQty?.toString() ?? "1",
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
      ...(isEdit ? {} : { productId: form.productId }),
      marketplace: form.marketplace,
      sellerSku: form.sellerSku,
      asin: form.asin || undefined,
      fnsku: form.fnsku || undefined,
      externalId: form.externalId || undefined,
      bundleQty: parseInt(form.bundleQty) || 1,
    };

    try {
      const url = isEdit ? `/api/listings/${listing.id}` : "/api/listings";
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

      {!isEdit && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Product (Master SKU) <span className="text-destructive">*</span>
          </label>
          <Select
            value={form.productId}
            onValueChange={(v) => setForm((p) => ({ ...p, productId: v ?? "" }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a product..." />
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
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Marketplace <span className="text-destructive">*</span>
          </label>
          <Select
            value={form.marketplace}
            onValueChange={(v) => setForm((p) => ({ ...p, marketplace: v ?? "AMAZON" }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKETPLACES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="sellerSku">
            Seller SKU <span className="text-destructive">*</span>
          </label>
          <Input
            id="sellerSku"
            value={form.sellerSku}
            onChange={set("sellerSku")}
            placeholder="AMZ-WH-AA-16"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="bundleQty">
            Bundle Qty <span className="text-destructive">*</span>
          </label>
          <Input
            id="bundleQty"
            type="number"
            min="1"
            value={form.bundleQty}
            onChange={set("bundleQty")}
            placeholder="1"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="asin">
            ASIN
          </label>
          <Input
            id="asin"
            value={form.asin}
            onChange={set("asin")}
            placeholder="B00XXXXXXX"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="fnsku">
            FNSKU
          </label>
          <Input
            id="fnsku"
            value={form.fnsku}
            onChange={set("fnsku")}
            placeholder="X00XXXXXXX"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="externalId">
            External ID
          </label>
          <Input
            id="externalId"
            value={form.externalId}
            onChange={set("externalId")}
            placeholder="Marketplace listing ID"
          />
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
            "Create Listing"
          )}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
