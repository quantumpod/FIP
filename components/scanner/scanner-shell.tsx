"use client";

import { useState } from "react";
import { ScannerTracking } from "./scanner-tracking";
import { ScannerOrder } from "./scanner-order";
import { ScannerPick } from "./scanner-pick";
import { ScannerPickPack } from "./scanner-pick-pack";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types/order";
import type { PickTask } from "@/types/pick-task";
import { PackageCheck, Search } from "lucide-react";

type ScannerMode = "menu" | "tracking" | "pick-pack";
type TrackingStep = "tracking" | "order" | "pick";

export function ScannerShell() {
  const [mode, setMode] = useState<ScannerMode>("menu");

  // Tracking lookup sub-state
  const [step, setStep] = useState<TrackingStep>("tracking");
  const [order, setOrder] = useState<Order | null>(null);
  const [pickTask, setPickTask] = useState<PickTask | null>(null);

  function handleOrderFound(o: Order) { setOrder(o); setStep("order"); }
  function handlePickTask(task: PickTask) { setPickTask(task); setStep("pick"); }
  function handleReset() { setOrder(null); setPickTask(null); setStep("tracking"); }

  // ── Mode selector ──────────────────────────────────────────────────────────

  if (mode === "menu") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
        <div className="text-center space-y-1 mb-4">
          <h1 className="text-2xl font-bold">Scanner Mode</h1>
          <p className="text-sm text-muted-foreground">Select an operation</p>
        </div>

        <Button
          className="w-full max-w-sm h-20 text-lg font-semibold gap-3 rounded-2xl"
          onClick={() => setMode("pick-pack")}
        >
          <PackageCheck className="h-7 w-7" />
          <div className="text-left">
            <p>Pick & Pack</p>
            <p className="text-xs font-normal opacity-70">Scan packing slip → pick items → scan label</p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="w-full max-w-sm h-20 text-lg font-semibold gap-3 rounded-2xl"
          onClick={() => { setMode("tracking"); setStep("tracking"); }}
        >
          <Search className="h-7 w-7" />
          <div className="text-left">
            <p>Tracking Lookup</p>
            <p className="text-xs font-normal opacity-70">Search order by tracking number</p>
          </div>
        </Button>
      </div>
    );
  }

  // ── Pick & Pack mode ───────────────────────────────────────────────────────

  if (mode === "pick-pack") {
    return <ScannerPickPack onExit={() => setMode("menu")} />;
  }

  // ── Tracking Lookup mode ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {step === "tracking" && (
        <ScannerTracking onOrderFound={handleOrderFound} />
      )}
      {step === "order" && order && (
        <ScannerOrder
          order={order}
          onBack={handleReset}
          onPickTask={handlePickTask}
        />
      )}
      {step === "pick" && pickTask && (
        <ScannerPick
          task={pickTask}
          onBack={() => {
            fetch(`/api/orders/${order!.id}`)
              .then((r) => r.json())
              .then((updated: Order) => { setOrder(updated); setStep("order"); })
              .catch(() => setStep("order"));
          }}
          onComplete={handleReset}
        />
      )}
    </div>
  );
}
