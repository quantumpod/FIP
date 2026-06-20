"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PickTaskStatusBadge } from "@/components/pick-tasks/pick-task-status-badge";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  MapPin,
  Package,
  Trophy,
} from "lucide-react";
import type { PickTask, PickTaskItem } from "@/types/pick-task";

interface ScannerPickProps {
  task: PickTask;
  onBack: () => void;
  onComplete: () => void;
}

export function ScannerPick({ task: initialTask, onBack, onComplete }: ScannerPickProps) {
  const [task, setTask] = useState<PickTask>(initialTask);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const items = task.items ?? [];
  const pickedCount = items.filter((i) => i.pickedQty >= i.quantity).length;
  const totalCount = items.length;
  const allPicked = pickedCount === totalCount && totalCount > 0;
  const progress = totalCount > 0 ? Math.round((pickedCount / totalCount) * 100) : 0;

  async function refreshTask() {
    const res = await fetch(`/api/pick-tasks/${task.id}`);
    const updated: PickTask = await res.json();
    setTask(updated);
  }

  async function handleStartPicking() {
    if (task.status !== "OPEN") return;
    setStatusLoading(true);
    try {
      await fetch(`/api/pick-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "IN_PROGRESS" }),
      });
      await refreshTask();
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleToggleItem(item: PickTaskItem) {
    if (task.status !== "IN_PROGRESS") return;
    setLoadingItem(item.id);
    try {
      const newQty = item.pickedQty >= item.quantity ? 0 : item.quantity;
      await fetch(`/api/pick-tasks/${task.id}/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickedQty: newQty }),
      });
      await refreshTask();
    } finally {
      setLoadingItem(null);
    }
  }

  async function handleComplete() {
    setStatusLoading(true);
    try {
      await fetch(`/api/pick-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      onComplete();
    } finally {
      setStatusLoading(false);
    }
  }

  if (task.status === "COMPLETED") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 text-center">
        <div className="rounded-2xl bg-emerald-500/10 p-6 border border-emerald-500/20">
          <Trophy className="h-14 w-14 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Pick Complete!</h2>
          <p className="text-muted-foreground mt-1">Order {task.order?.orderNumber} is ready to pack.</p>
        </div>
        <Button onClick={onComplete} className="w-full max-w-sm h-14 text-base font-semibold">
          Done — Scan Next Order
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pb-8">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-4 w-4" />
        Back to order
      </button>

      {/* Header */}
      <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Pick Task</p>
            <p className="font-mono font-bold">{task.order?.orderNumber}</p>
          </div>
          <PickTaskStatusBadge status={task.status} />
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{pickedCount}/{totalCount} items</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Start button if OPEN */}
      {task.status === "OPEN" && (
        <Button
          onClick={handleStartPicking}
          disabled={statusLoading}
          className="w-full h-14 text-base font-semibold"
        >
          {statusLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Package className="h-5 w-5" />}
          Start Picking
        </Button>
      )}

      {/* Pick list */}
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
          <Package className="h-3 w-3" /> Pick List
        </p>
        {items.map((item) => {
          const done = item.pickedQty >= item.quantity;
          const isLoading = loadingItem === item.id;
          const canTap = task.status === "IN_PROGRESS" && !isLoading;

          return (
            <button
              key={item.id}
              onClick={() => canTap && handleToggleItem(item)}
              disabled={!canTap}
              className={`w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.98] ${
                done
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : task.status === "IN_PROGRESS"
                  ? "border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5"
                  : "border-border/40 bg-card/60 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                {isLoading ? (
                  <Loader2 className="h-7 w-7 shrink-0 animate-spin text-muted-foreground" />
                ) : done ? (
                  <CheckCircle2 className="h-7 w-7 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-7 w-7 shrink-0 text-muted-foreground/30" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-mono font-bold text-base">{item.product?.masterSku ?? "—"}</p>
                  <p className="text-sm text-muted-foreground truncate">{item.product?.name}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="font-mono">{item.location?.code ?? "—"}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-2xl font-bold tabular-nums ${done ? "text-emerald-400" : ""}`}>
                    ×{item.quantity}
                  </p>
                  {item.pickedQty > 0 && !done && (
                    <p className="text-xs text-muted-foreground">{item.pickedQty} picked</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Complete button */}
      {task.status === "IN_PROGRESS" && (
        <Button
          onClick={handleComplete}
          disabled={!allPicked || statusLoading}
          className={`w-full h-14 text-base font-semibold ${allPicked ? "bg-emerald-600 hover:bg-emerald-500" : ""}`}
        >
          {statusLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          {allPicked ? "Complete Pick Task" : `Pick ${totalCount - pickedCount} more item${totalCount - pickedCount !== 1 ? "s" : ""}`}
        </Button>
      )}
    </div>
  );
}
