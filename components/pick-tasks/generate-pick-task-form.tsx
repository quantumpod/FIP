"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  marketplace: string;
  status: string;
}

interface GeneratePickTaskFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function GeneratePickTaskForm({ onSuccess, onCancel }: GeneratePickTaskFormProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load READY_TO_PICK and NEW orders
    fetch("/api/orders?limit=100")
      .then((r) => r.json())
      .then((d) => {
        const eligible = (d.data ?? []).filter(
          (o: Order) => o.status === "NEW" || o.status === "READY_TO_PICK"
        );
        setOrders(eligible);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/pick-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
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

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Order <span className="text-destructive">*</span>
        </label>
        <Select value={orderId} onValueChange={(v) => setOrderId(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="Select an order..." />
          </SelectTrigger>
          <SelectContent>
            {orders.length === 0 ? (
              <SelectItem value="__none__" disabled>No eligible orders</SelectItem>
            ) : (
              orders.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.orderNumber} — {o.marketplace} ({o.status.replace("_", " ")})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Shows NEW and READY TO PICK orders</p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading || !orderId}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : "Generate Pick Task"}
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
