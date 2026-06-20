"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { MarketplaceBadge } from "@/components/listings/marketplace-badge";
import { ArrowLeft, ClipboardList, Loader2, AlertCircle, Package, MapPin } from "lucide-react";
import type { Order } from "@/types/order";
import type { PickTask } from "@/types/pick-task";
import type { Marketplace } from "@/types/listing";

interface ScannerOrderProps {
  order: Order;
  onBack: () => void;
  onPickTask: (task: PickTask) => void;
}

export function ScannerOrder({ order, onBack, onPickTask }: ScannerOrderProps) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if order already has open/in-progress pick tasks
  const activeTask = order.pickTasks?.find(
    (t) => t.status === "OPEN" || t.status === "IN_PROGRESS"
  );

  async function handleGeneratePickTask() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/pick-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate pick task.");
        return;
      }
      onPickTask(data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleOpenExistingTask() {
    if (!activeTask) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/pick-tasks/${activeTask.id}`);
      const data: PickTask = await res.json();
      onPickTask(data);
    } catch {
      setError("Failed to load pick task.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 pb-8">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" />
        Scan another
      </button>

      {/* Order Card */}
      <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Order</p>
            <p className="text-3xl font-bold font-mono tracking-tight">{order.orderNumber}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Marketplace</p>
            <MarketplaceBadge marketplace={order.marketplace as Marketplace} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Tracking</p>
            <p className="font-mono text-sm truncate">{order.trackingNumber ?? "—"}</p>
          </div>
        </div>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Items</p>
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3">
                  <div>
                    <p className="font-mono font-bold text-sm">{item.product?.masterSku ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{item.product?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold tabular-nums">×{item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Actions */}
      {activeTask ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <Package className="h-4 w-4" />
            Active pick task exists
          </div>
          <Button
            onClick={handleOpenExistingTask}
            disabled={generating}
            className="w-full h-14 text-base font-semibold"
          >
            {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <ClipboardList className="h-5 w-5" />}
            Open Pick Task
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleGeneratePickTask}
          disabled={generating || order.status === "SHIPPED" || order.status === "CANCELLED" || order.status === "PACKED"}
          className="w-full h-14 text-base font-semibold"
        >
          {generating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ClipboardList className="h-5 w-5" />
          )}
          Generate Pick Task
        </Button>
      )}

      {(order.status === "SHIPPED" || order.status === "PACKED" || order.status === "CANCELLED") && (
        <p className="text-center text-sm text-muted-foreground">
          This order is {order.status.toLowerCase()} — no pick task needed.
        </p>
      )}
    </div>
  );
}
