"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "./order-status-badge";
import { MarketplaceBadge } from "@/components/listings/marketplace-badge";
import { Search, Loader2, Package, ScanLine, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Order } from "@/types/order";
import type { Marketplace } from "@/types/listing";

export function TrackingLookup() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const tracking = input.trim();
    if (!tracking) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/orders/tracking?number=${encodeURIComponent(tracking)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Order not found.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      inputRef.current?.select();
    }
  }

  function handleReset() {
    setInput("");
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Search Bar */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScanLine className="h-4 w-4 text-primary" />
            Scan or Enter Tracking Number
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="1Z999999999… or 940011189922385…"
              className="font-mono"
              autoFocus
              disabled={loading}
            />
            <Button type="submit" disabled={loading || input.trim().length < 3}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Lookup
            </Button>
            {(result || error) && (
              <Button type="button" variant="ghost" onClick={handleReset}>
                Clear
              </Button>
            )}
          </form>
          {input.length > 0 && input.length < 3 && (
            <p className="mt-1.5 text-xs text-muted-foreground">Enter at least 3 characters</p>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Order found
          </div>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Order Number</p>
                  <p className="text-xl font-bold font-mono tracking-tight">#{result.orderNumber}</p>
                </div>
                <OrderStatusBadge status={result.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Marketplace</p>
                  <MarketplaceBadge marketplace={result.marketplace as Marketplace} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tracking Number</p>
                  <p className="font-mono text-sm">{result.trackingNumber ?? "—"}</p>
                </div>
                {result.carrier && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Carrier</p>
                    <p>{result.carrier}</p>
                  </div>
                )}
                {result.externalOrderId && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">External Order ID</p>
                    <p className="font-mono text-xs">{result.externalOrderId}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Created</p>
                  <p>{new Date(result.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {result.items && result.items.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Order Items ({result.items.length})
                  </p>
                  <div className="space-y-2">
                    {result.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-sm font-semibold">{item.product?.masterSku ?? "—"}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.product?.name}</p>
                        </div>
                        <div className="ml-4 text-right shrink-0">
                          <p className="text-sm font-medium tabular-nums">×{item.quantity}</p>
                          <p className="text-xs text-muted-foreground">units</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.pickTasks && result.pickTasks.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Pick Tasks ({result.pickTasks.length})
                  </p>
                  <div className="space-y-1">
                    {result.pickTasks.map((pt) => (
                      <div
                        key={pt.id}
                        className="flex items-center justify-between rounded border border-border/40 px-3 py-1.5 text-xs"
                      >
                        <span className="font-mono text-muted-foreground">{pt.id.slice(0, 12)}…</span>
                        <span className="text-muted-foreground">{pt.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Idle state */}
      {!result && !error && !loading && (
        <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
          <ScanLine className="h-10 w-10 opacity-20" />
          <p className="text-sm">Scan a barcode or type a tracking number above</p>
          <p className="text-xs opacity-60">Works with UPS, FedEx, USPS, and carrier tracking numbers</p>
        </div>
      )}
    </div>
  );
}
