"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, CheckCircle2, Circle, Loader2, Package,
  PackageCheck, Scan, ScanLine, Trophy, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: string;
  quantity: number;
  product: { id: string; masterSku: string; name: string; barcode: string | null } | null;
  listing: { id: string; sellerSku: string; marketplace: string } | null;
}

interface ScannedOrder {
  id: string;
  orderNumber: string;
  marketplace: string;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  items: OrderItem[];
}

type Step = "scan-slip" | "pick-items" | "scan-label" | "done";

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectCarrier(code: string): string | undefined {
  if (/^(382|396|386|387|388)\d+/.test(code)) return "FedEx";
  if (/^(92|94|93|95)\d{18,}/.test(code)) return "USPS";
  if (/^1Z/.test(code)) return "UPS";
  if (/^\d{12,22}$/.test(code) && code.startsWith("0")) return "DHL";
  return undefined;
}

function isTrackingBarcode(code: string): boolean {
  return !!detectCarrier(code) || /^\d{20,22}$/.test(code) || /^1Z/.test(code);
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props { onExit: () => void }

export function ScannerPickPack({ onExit }: Props) {
  const [step, setStep] = useState<Step>("scan-slip");
  const [order, setOrder] = useState<ScannedOrder | null>(null);
  const [pickedItems, setPickedItems] = useState<Set<string>>(new Set());
  const [scannedLabel, setScannedLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<"success" | "error" | null>(null);
  const [scanInput, setScanInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep input focused at all times
  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    document.addEventListener("click", focus);
    return () => document.removeEventListener("click", focus);
  }, [step]);

  function showFlash(type: "success" | "error") {
    setFlash(type);
    setTimeout(() => setFlash(null), 700);
  }

  // ── Step 1: scan packing slip barcode → find order ────────────────────────

  async function handleSlipScan(code: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/scan/order?q=${encodeURIComponent(code)}`);
      if (!res.ok) {
        const j = await res.json();
        setError(j.error ?? "Order not found");
        showFlash("error");
        return;
      }
      const o: ScannedOrder = await res.json();
      setOrder(o);
      setPickedItems(new Set());
      setStep("pick-items");
      showFlash("success");
    } catch {
      setError("Connection error");
      showFlash("error");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: scan each item SKU/barcode ────────────────────────────────────

  function handleItemScan(code: string) {
    if (!order) return;

    // If this looks like a tracking barcode, jump straight to label step
    if (isTrackingBarcode(code)) {
      handleLabelCapture(code);
      return;
    }

    const normalized = code.trim().toLowerCase();

    // Match against: product barcode, product masterSku, listing sellerSku
    const matched = order.items.find((item) => {
      const barcode = item.product?.barcode?.toLowerCase();
      const masterSku = item.product?.masterSku?.toLowerCase();
      const sellerSku = item.listing?.sellerSku?.toLowerCase();
      return (
        normalized === barcode ||
        normalized === masterSku ||
        normalized === sellerSku
      );
    });

    if (!matched) {
      setError(`SKU "${code}" not found in this order`);
      showFlash("error");
      return;
    }

    if (pickedItems.has(matched.id)) {
      setError(`"${matched.product?.masterSku ?? matched.listing?.sellerSku}" already picked`);
      showFlash("error");
      return;
    }

    setPickedItems((prev) => new Set([...prev, matched.id]));
    setError(null);
    showFlash("success");

    // If all items picked, move to label scan
    const newPicked = new Set([...pickedItems, matched.id]);
    if (newPicked.size === order.items.length) {
      setTimeout(() => setStep("scan-label"), 600);
    }
  }

  // ── Step 3: scan shipping label barcode ───────────────────────────────────

  async function handleLabelCapture(code: string) {
    if (!order) return;
    const carrier = detectCarrier(code);
    setScannedLabel(code);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/scan/label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, trackingNumber: code, carrier }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error saving label");
      showFlash("success");
      setTimeout(() => setStep("done"), 500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
      showFlash("error");
    } finally {
      setLoading(false);
    }
  }

  // ── Unified scan handler ──────────────────────────────────────────────────

  function handleScan(code: string) {
    if (!code.trim() || loading) return;
    setScanInput("");
    if (step === "scan-slip") handleSlipScan(code.trim());
    else if (step === "pick-items") handleItemScan(code.trim());
    else if (step === "scan-label") handleLabelCapture(code.trim());
  }

  const allPicked = order ? pickedItems.size === order.items.length : false;

  // ── UI ────────────────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      flash === "success" ? "bg-emerald-950/30" :
      flash === "error" ? "bg-red-950/30" : "bg-background"
    }`}>

      {/* Hidden scanner input — always active */}
      <input
        ref={inputRef}
        value={scanInput}
        onChange={e => setScanInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter" && scanInput.trim()) handleScan(scanInput);
        }}
        className="opacity-0 absolute w-0 h-0 pointer-events-none"
        autoFocus
        readOnly={loading}
      />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <button onClick={onExit} className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Exit
        </button>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pick & Pack</span>
        <div className="w-12" />
      </div>

      <div className="flex-1 flex flex-col px-4 py-6 gap-6">

        {/* ── STEP 1: Scan Packing Slip ── */}
        {step === "scan-slip" && (
          <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
            <div className="rounded-3xl bg-primary/10 border border-primary/20 p-8">
              <ScanLine className="h-16 w-16 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Scan Packing Slip</h2>
              <p className="text-muted-foreground mt-2 text-sm">Scan the barcode at the bottom of the Veeqo packing slip</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3 text-sm w-full">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {loading && <Loader2 className="h-8 w-8 animate-spin text-primary" />}

            {/* Manual input fallback */}
            <div className="w-full space-y-2">
              <p className="text-xs text-muted-foreground">Or type order number manually:</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="#P-1852780941"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && scanInput.trim()) handleScan(scanInput); }}
                />
                <Button onClick={() => scanInput.trim() && handleScan(scanInput)} disabled={loading || !scanInput.trim()} className="h-12 px-5">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Pick Items ── */}
        {step === "pick-items" && order && (
          <div className="flex flex-col gap-4">
            {/* Order header */}
            <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-mono font-bold text-lg">{order.orderNumber}</p>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                  {order.marketplace.toLowerCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {pickedItems.size}/{order.items.length} items picked
              </p>
              {/* Progress */}
              <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${order.items.length ? (pickedItems.size / order.items.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Scan prompt */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3">
              <ScanLine className="h-5 w-5 text-primary shrink-0" />
              <p className="text-sm text-primary">Scan item barcode or SKU to confirm pick</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {/* Item list */}
            <div className="space-y-3">
              {order.items.map((item) => {
                const done = pickedItems.has(item.id);
                const veeqoSku = item.listing?.sellerSku;
                const masterSku = item.product?.masterSku;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      done
                        ? "border-emerald-500/40 bg-emerald-950/20"
                        : "border-border/50 bg-card"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {done
                        ? <CheckCircle2 className="h-8 w-8 text-emerald-400 shrink-0" />
                        : <Circle className="h-8 w-8 text-muted-foreground/30 shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="font-mono font-bold text-base">{veeqoSku ?? masterSku ?? "—"}</p>
                        {veeqoSku && masterSku && veeqoSku !== masterSku && (
                          <p className="text-xs text-muted-foreground font-mono">→ {masterSku}</p>
                        )}
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {item.product?.name ?? "Unknown product"}
                        </p>
                      </div>
                      <p className={`text-3xl font-bold tabular-nums ${done ? "text-emerald-400" : ""}`}>
                        ×{item.quantity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Manual override: skip to label scan */}
            {allPicked && (
              <Button
                onClick={() => setStep("scan-label")}
                className="w-full h-14 text-base font-semibold bg-emerald-600 hover:bg-emerald-500 mt-2"
              >
                <PackageCheck className="h-5 w-5" /> All Picked — Scan Label
              </Button>
            )}
          </div>
        )}

        {/* ── STEP 3: Scan Shipping Label ── */}
        {step === "scan-label" && order && (
          <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
            <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-8">
              <Package className="h-16 w-16 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Scan Shipping Label</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Scan the FedEx or USPS barcode on the shipping label
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Order: <span className="font-mono font-bold">{order.orderNumber}</span>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-950/30 border border-red-800/40 rounded-xl px-4 py-3 text-sm w-full">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {loading && <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />}

            {/* Manual input */}
            <div className="w-full space-y-2">
              <p className="text-xs text-muted-foreground">Or enter tracking number manually:</p>
              <div className="flex gap-2">
                <input
                  className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="382149437000"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && scanInput.trim()) handleScan(scanInput); }}
                />
                <Button
                  onClick={() => scanInput.trim() && handleScan(scanInput)}
                  disabled={loading || !scanInput.trim()}
                  className="h-12 px-5 bg-emerald-700 hover:bg-emerald-600"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Skip if label already in Veeqo */}
            {order.trackingNumber && (
              <button
                className="text-xs text-muted-foreground underline underline-offset-2"
                onClick={() => { setScannedLabel(order.trackingNumber!); setStep("done"); }}
              >
                Skip — tracking already recorded ({order.trackingNumber})
              </button>
            )}
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === "done" && order && (
          <div className="flex flex-col items-center justify-center flex-1 gap-6 text-center">
            <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-8">
              <Trophy className="h-16 w-16 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Order Packed!</h2>
              <p className="text-muted-foreground mt-2">{order.orderNumber}</p>
              {scannedLabel && (
                <p className="text-xs font-mono text-emerald-400 mt-1">
                  {detectCarrier(scannedLabel) ?? "Tracking"}: {scannedLabel}
                </p>
              )}
            </div>

            <div className="w-full space-y-3 max-w-sm">
              <Button
                className="w-full h-14 text-base font-semibold"
                onClick={() => {
                  setOrder(null);
                  setPickedItems(new Set());
                  setScannedLabel(null);
                  setError(null);
                  setScanInput("");
                  setStep("scan-slip");
                }}
              >
                <ScanLine className="h-5 w-5" /> Scan Next Order
              </Button>
              <Button variant="outline" className="w-full h-12" onClick={onExit}>
                Exit Scanner
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
