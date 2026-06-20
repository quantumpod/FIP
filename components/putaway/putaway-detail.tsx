"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PutawayStatusBadge } from "./putaway-status-badge";
import type { PutawayTask } from "@/types/warehouse-ops";
import { CheckCircle2, Loader2, ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";

interface Props {
  task: PutawayTask;
  onUpdate: (updated: PutawayTask) => void;
}

export function PutawayDetail({ task, onUpdate }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(task.items.map(i => [i.id, i.putawayQty]))
  );
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const isDone = task.status === "COMPLETED" || task.status === "CANCELLED";
  const allPutaway = task.items.every(i => (quantities[i.id] ?? i.putawayQty) >= i.quantity);

  async function saveItem(itemId: string, qty: number) {
    await fetch(`/api/putaway/${task.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ putawayQty: qty }),
    });
  }

  async function handleStart() {
    setSaving(true);
    try {
      const res = await fetch(`/api/putaway/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      onUpdate(await res.json());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    setCompleting(true);
    try {
      await Promise.all(
        task.items.map(item => saveItem(item.id, quantities[item.id] ?? item.putawayQty))
      );
      const res = await fetch(`/api/putaway/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success("Putaway completed — inventory updated");
      onUpdate(await res.json());
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <PutawayStatusBadge status={task.status} />
        {task.receivingOrder && (
          <span className="text-sm text-muted-foreground font-mono">{task.receivingOrder.poNumber}</span>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Items</p>
        {task.items.map(item => (
          <div key={item.id} className="flex items-center gap-3 rounded-md border border-border/50 bg-muted/20 px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-semibold">{item.product?.masterSku ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{item.product?.name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground font-mono">{item.location?.code}</span>
              <span className="text-xs text-muted-foreground">need: {item.quantity}</span>
              {isDone ? (
                <span className="text-sm font-medium tabular-nums">{item.putawayQty} put away</span>
              ) : (
                <Input
                  type="number"
                  min={0}
                  max={item.quantity}
                  value={quantities[item.id] ?? 0}
                  onChange={e => setQuantities(prev => ({ ...prev, [item.id]: Number(e.target.value) }))}
                  className="w-20 h-8 text-sm text-center"
                  disabled={task.status === "OPEN"}
                />
              )}
              {(quantities[item.id] ?? item.putawayQty) >= item.quantity && (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      {!isDone && (
        <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
          {task.status === "OPEN" && (
            <Button onClick={handleStart} disabled={saving} variant="outline">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowDownToLine className="h-4 w-4 mr-2" />}
              Start Putaway
            </Button>
          )}
          {task.status === "IN_PROGRESS" && (
            <Button onClick={handleComplete} disabled={completing || !allPutaway}>
              {completing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Complete & Update Inventory
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
