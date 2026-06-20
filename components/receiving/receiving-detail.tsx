"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ReceivingStatusBadge } from "./receiving-status-badge";
import type { ReceivingOrder, ReceivingItem } from "@/types/warehouse-ops";
import { CheckCircle2, Loader2, Package, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Props {
  order: ReceivingOrder;
  onUpdate: (updated: ReceivingOrder) => void;
}

export function ReceivingDetail({ order, onUpdate }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(order.items.map((i) => [i.id, i.receivedQty]))
  );
  const [saving, setSaving] = useState(false);
  const [generatingPutaway, setGeneratingPutaway] = useState(false);

  const isDone = order.status === "COMPLETED" || order.status === "CANCELLED";

  async function handleReceive() {
    setSaving(true);
    try {
      const res = await fetch(`/api/receiving/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: Object.entries(quantities).map(([id, receivedQty]) => ({ id, receivedQty })),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      const updated = await res.json();
      toast.success("Quantities saved");
      onUpdate(updated);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  async function handleGeneratePutaway() {
    setGeneratingPutaway(true);
    try {
      const res = await fetch("/api/putaway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receivingOrderId: order.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success("Putaway task generated");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setGeneratingPutaway(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <ReceivingStatusBadge status={order.status} />
        {order.warehouse && (
          <Badge variant="outline" className="text-xs">{order.warehouse.code}</Badge>
        )}
        {order.supplier && (
          <span className="text-sm text-muted-foreground">Supplier: {order.supplier}</span>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Items</p>
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-md border border-border/50 bg-muted/20 px-3 py-2.5"
          >
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm font-semibold">{item.product?.masterSku ?? "—"}</p>
              <p className="text-xs text-muted-foreground truncate">{item.product?.name}</p>
              {item.lotNumber && <p className="text-xs text-muted-foreground">Lot: {item.lotNumber}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground">Expected: {item.expectedQty}</span>
              {isDone ? (
                <span className="text-sm font-medium tabular-nums">{item.receivedQty} received</span>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Received:</span>
                  <Input
                    type="number"
                    min={0}
                    max={item.expectedQty * 2}
                    value={quantities[item.id] ?? 0}
                    onChange={(e) =>
                      setQuantities((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))
                    }
                    className="w-20 h-8 text-sm text-center"
                  />
                </div>
              )}
              {item.receivedQty >= item.expectedQty && (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      {!isDone && (
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={handleReceive} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Package className="h-4 w-4 mr-2" />}
            Save Quantities
          </Button>
        </div>
      )}

      {order.status === "COMPLETED" && (
        <div className="pt-2 border-t border-border/50">
          <Button onClick={handleGeneratePutaway} disabled={generatingPutaway} variant="outline" className="gap-2">
            {generatingPutaway ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Generate Putaway Task
          </Button>
        </div>
      )}
    </div>
  );
}
