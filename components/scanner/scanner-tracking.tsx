"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine, Loader2, AlertCircle, ChevronRight, X } from "lucide-react";
import type { Order } from "@/types/order";

interface ScannerTrackingProps {
  onOrderFound: (order: Order) => void;
}

export function ScannerTracking({ onOrderFound }: ScannerTrackingProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const tracking = input.trim();
    if (!tracking || tracking.length < 3) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/tracking?number=${encodeURIComponent(tracking)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Order not found.");
        inputRef.current?.select();
      } else {
        onOrderFound(data);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
      {/* Icon */}
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-5 border border-primary/20">
          <ScanLine className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Scan Tracking</h2>
        <p className="text-muted-foreground text-center text-sm">
          Scan or type a carrier tracking number
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSearch} className="w-full max-w-sm space-y-4">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(null); }}
          placeholder="Tracking number…"
          className="h-14 text-lg font-mono text-center tracking-wider border-2 focus:border-primary"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          disabled={loading}
        />

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-14 text-base font-semibold"
          disabled={loading || input.trim().length < 3}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Lookup Order
              <ChevronRight className="h-5 w-5 ml-1" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
