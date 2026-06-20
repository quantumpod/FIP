"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PickTaskStatusBadge } from "./pick-task-status-badge";
import { MarketplaceBadge } from "@/components/listings/marketplace-badge";
import { CheckCircle2, Circle, Loader2, MapPin, Package } from "lucide-react";
import type { PickTask, PickTaskStatus } from "@/types/pick-task";
import type { Marketplace } from "@/types/listing";

const STATUS_TRANSITIONS: Record<PickTaskStatus, PickTaskStatus | null> = {
  OPEN: "IN_PROGRESS",
  IN_PROGRESS: "COMPLETED",
  COMPLETED: null,
  CANCELLED: null,
};

const NEXT_LABEL: Record<PickTaskStatus, string> = {
  OPEN: "Start Picking",
  IN_PROGRESS: "Mark Complete",
  COMPLETED: "",
  CANCELLED: "",
};

interface PickTaskDetailProps {
  task: PickTask;
  onUpdate: () => void;
}

export function PickTaskDetail({ task, onUpdate }: PickTaskDetailProps) {
  const [saving, setSaving] = useState(false);
  const [pickingItem, setPickingItem] = useState<string | null>(null);

  const nextStatus = STATUS_TRANSITIONS[task.status];

  async function handleStatusChange() {
    if (!nextStatus) return;
    setSaving(true);
    try {
      await fetch(`/api/pick-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      onUpdate();
    } finally {
      setSaving(false);
    }
  }

  async function handlePickItem(itemId: string, quantity: number, currentPicked: number) {
    const newQty = currentPicked >= quantity ? 0 : quantity;
    setPickingItem(itemId);
    try {
      await fetch(`/api/pick-tasks/${task.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickedQty: newQty }),
      });
      onUpdate();
    } finally {
      setPickingItem(null);
    }
  }

  const allPicked = task.items?.every((i) => i.pickedQty >= i.quantity) ?? false;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pick Task</p>
              <p className="font-mono text-lg font-bold">{task.id.slice(0, 12)}…</p>
            </div>
            <PickTaskStatusBadge status={task.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Order</p>
              <p className="font-mono font-medium">{task.order?.orderNumber ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Marketplace</p>
              {task.order?.marketplace && (
                <MarketplaceBadge marketplace={task.order.marketplace as Marketplace} />
              )}
            </div>
            {task.order?.trackingNumber && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Tracking</p>
                <p className="font-mono text-sm">{task.order.trackingNumber}</p>
              </div>
            )}
          </div>

          {nextStatus && (
            <Button
              onClick={handleStatusChange}
              disabled={saving || (nextStatus === "COMPLETED" && !allPicked)}
              className="w-full"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {NEXT_LABEL[task.status]}
            </Button>
          )}
          {nextStatus === "COMPLETED" && !allPicked && (
            <p className="text-xs text-center text-muted-foreground">Pick all items before completing</p>
          )}
        </CardContent>
      </Card>

      {/* Pick List */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Pick List ({task.items?.length ?? 0} items)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {task.items?.map((item) => {
            const done = item.pickedQty >= item.quantity;
            const isLoading = pickingItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() =>
                  task.status === "IN_PROGRESS" &&
                  handlePickItem(item.id, item.quantity, item.pickedQty)
                }
                disabled={task.status !== "IN_PROGRESS" || isLoading}
                className={`w-full text-left rounded-md border px-4 py-3 transition-colors ${
                  done
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : "border-border/50 bg-muted/10 hover:bg-muted/30"
                } ${task.status === "IN_PROGRESS" ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex items-center gap-3">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
                  ) : done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm font-semibold">{item.product?.masterSku ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.product?.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${done ? "text-emerald-400" : ""}`}>
                      {item.pickedQty}/{item.quantity}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
                      <MapPin className="h-3 w-3" />
                      {item.location?.code ?? "—"}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
