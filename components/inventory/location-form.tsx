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
import type { Location } from "@/types/inventory";

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface LocationFormProps {
  location?: Location;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormState {
  warehouseId: string;
  code: string;
  zone: string;
  aisle: string;
  rack: string;
  bin: string;
  isActive: boolean;
}

export function LocationForm({ location, onSuccess, onCancel }: LocationFormProps) {
  const isEdit = !!location;
  const [form, setForm] = useState<FormState>({
    warehouseId: location?.warehouseId ?? "",
    code: location?.code ?? "",
    zone: location?.zone ?? "",
    aisle: location?.aisle ?? "",
    rack: location?.rack ?? "",
    bin: location?.bin ?? "",
    isActive: location?.isActive ?? true,
  });
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/warehouses")
      .then((r) => r.json())
      .then((d) => setWarehouses(Array.isArray(d) ? d : d.data ?? []))
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
      ...(isEdit ? {} : { warehouseId: form.warehouseId }),
      code: form.code,
      zone: form.zone || undefined,
      aisle: form.aisle || undefined,
      rack: form.rack || undefined,
      bin: form.bin || undefined,
      isActive: form.isActive,
    };

    try {
      const url = isEdit ? `/api/locations/${location.id}` : "/api/locations";
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
            Warehouse <span className="text-destructive">*</span>
          </label>
          <Select
            value={form.warehouseId}
            onValueChange={(v) => setForm((p) => ({ ...p, warehouseId: v ?? "" }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select warehouse..." />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.code} — {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="code">
          Location Code <span className="text-destructive">*</span>
        </label>
        <Input
          id="code"
          value={form.code}
          onChange={set("code")}
          placeholder="A01-R01-B01"
          required
          disabled={isEdit}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="zone">Zone</label>
          <Input id="zone" value={form.zone} onChange={set("zone")} placeholder="A" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="aisle">Aisle</label>
          <Input id="aisle" value={form.aisle} onChange={set("aisle")} placeholder="01" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="rack">Rack</label>
          <Input id="rack" value={form.rack} onChange={set("rack")} placeholder="R01" />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="bin">Bin</label>
        <Input id="bin" value={form.bin} onChange={set("bin")} placeholder="B01" />
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={form.isActive ? "true" : "false"}
            onValueChange={(v) => setForm((p) => ({ ...p, isActive: v === "true" }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEdit ? "Saving..." : "Creating..."}
            </>
          ) : isEdit ? "Save Changes" : "Create Location"}
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
