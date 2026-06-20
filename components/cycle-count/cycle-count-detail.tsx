"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CycleCountStatusBadge } from "./cycle-count-status-badge";
import type { CycleCount } from "@/types/warehouse-ops";
import { CheckCircle2, Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { toast } from "sonner";

interface Props {
  cycleCount: CycleCount;
  onUpdate: (updated: CycleCount) => void;
}

export function CycleCountDetail({ cycleCount, onUpdate }: Props) {
  const [counts, setCounts] = useState<Record<string, string>>(
    Object.fromEntries(cycleCount.items.map(i => [i.id, i.countedQty !== null ? String(i.countedQty) : ""]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const isDone = cycleCount.status === "COMPLETED" || cycleCount.status === "CANCELLED";
  const allCounted = cycleCount.items.every(i => i.countedQty !== null);

  async function submitItem(itemId: string) {
    const val = Number(counts[itemId]);
    if (isNaN(val) || val < 0) return;
    setSaving(itemId);
    try {
      const res = await fetch(`/api/cycle-counts/${cycleCount.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countedQty: val }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      onUpdate(await res.json());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(null);
    }
  }

  async function complete() {
    setCompleting(true);
    try {
      const res = await fetch(`/api/cycle-counts/${cycleCount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success("Cycle count completed — inventory adjusted");
      onUpdate(await res.json());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <CycleCountStatusBadge status={cycleCount.status} />
        {cycleCount.warehouse && (
          <span className="text-sm text-muted-foreground">{cycleCount.warehouse.code} — {cycleCount.warehouse.name}</span>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Items ({cycleCount.items.length})
        </p>
        {cycleCount.items.map((item) => {
          const variance = item.variance;
          const hasCounted = item.countedQty !== null;
          return (
            <div key={item.id} className="flex items-center gap-3 rounded-md border border-border/50 bg-muted/20 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm font-semibold">{item.product?.masterSku ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{item.location?.code}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground">System: {item.systemQty}</span>
                {isDone ? (
                  <span className="text-sm font-medium">{item.countedQty ?? "—"}</span>
                ) : (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min={0}
                      value={counts[item.id] ?? ""}
                      onChange={e => setCounts(prev => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder="Count"
                      className="w-20 h-8 text-sm text-center"
                      disabled={!!saving}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={saving === item.id || counts[item.id] === ""}
                      onClick={() => submitItem(item.id)}
                    >
                      {saving === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                )}
                {hasCounted && variance !== null && (
                  <span className={`flex items-center gap-0.5 text-xs font-medium ${variance > 0 ? "text-emerald-400" : variance < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                    {variance > 0 ? <TrendingUp className="h-3 w-3" /> : variance < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {variance > 0 ? `+${variance}` : variance}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!isDone && allCounted && (
        <div className="flex justify-end pt-2 border-t border-border/50">
          <Button onClick={complete} disabled={completing}>
            {completing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Complete & Adjust Inventory
          </Button>
        </div>
      )}
    </div>
  );
}
