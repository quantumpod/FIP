"use client";

import { useState } from "react";
import { ScannerTracking } from "./scanner-tracking";
import { ScannerOrder } from "./scanner-order";
import { ScannerPick } from "./scanner-pick";
import type { Order } from "@/types/order";
import type { PickTask } from "@/types/pick-task";

type ScannerStep = "tracking" | "order" | "pick";

export function ScannerShell() {
  const [step, setStep] = useState<ScannerStep>("tracking");
  const [order, setOrder] = useState<Order | null>(null);
  const [pickTask, setPickTask] = useState<PickTask | null>(null);

  function handleOrderFound(o: Order) {
    setOrder(o);
    setStep("order");
  }

  function handlePickTask(task: PickTask) {
    setPickTask(task);
    setStep("pick");
  }

  function handleReset() {
    setOrder(null);
    setPickTask(null);
    setStep("tracking");
  }

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
            // Reload order with updated pick tasks
            fetch(`/api/orders/${order!.id}`)
              .then((r) => r.json())
              .then((updated: Order) => {
                setOrder(updated);
                setStep("order");
              })
              .catch(() => setStep("order"));
          }}
          onComplete={handleReset}
        />
      )}
    </div>
  );
}
