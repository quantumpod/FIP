"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { CONNECTOR_FIELDS } from "@/types/integrations";
import type { Marketplace } from "@/types/listing";

const MARKETPLACES: { value: Marketplace; label: string }[] = [
  { value: "AMAZON", label: "Amazon" },
  { value: "WALMART", label: "Walmart" },
  { value: "EBAY", label: "eBay" },
  { value: "SHOPIFY", label: "Shopify" },
  { value: "VEEQO", label: "Veeqo" },
];

export function ConnectionForm({ onSuccess }: { onSuccess: () => void }) {
  const [marketplace, setMarketplace] = useState<Marketplace | "">("");
  const [name, setName] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const fields = marketplace ? CONNECTOR_FIELDS[marketplace] : [];

  function setVal(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!marketplace || !name) { toast.error("Select a marketplace and enter a name"); return; }

    const credentials: Record<string, string> = {};
    const settings: Record<string, string> = {};
    for (const field of fields) {
      if (values[field.key]) {
        if (field.isCredential) credentials[field.key] = values[field.key];
        else settings[field.key] = values[field.key];
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/integrations/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketplace, name, credentials, settings }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success("Connection created");
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
          <Label>Marketplace *</Label>
          <Select value={marketplace} onValueChange={v => { setMarketplace(v as Marketplace); setValues({}); }}>
            <SelectTrigger><SelectValue placeholder="Select marketplace" /></SelectTrigger>
            <SelectContent>
              {MARKETPLACES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Connection Name *</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amazon US" />
        </div>
      </div>

      {fields.length > 0 && (
        <div className="space-y-3 rounded-md border border-border/50 p-4 bg-muted/10">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Credentials & Settings</p>
          {fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label>{field.label}{field.required ? " *" : ""}</Label>
              <div className="relative">
                <Input
                  type={field.type === "password" && !showSecrets[field.key] ? "password" : "text"}
                  value={values[field.key] ?? ""}
                  onChange={e => setVal(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="font-mono text-sm pr-10"
                />
                {field.type === "password" && (
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowSecrets(p => ({ ...p, [field.key]: !p[field.key] }))}
                  >
                    {showSecrets[field.key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Credentials are stored encrypted in the database.</p>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Create Connection
        </Button>
      </div>
    </form>
  );
}
