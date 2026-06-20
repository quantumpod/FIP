"use client";

import { useState } from "react";
import { ConnectionsList } from "@/components/integrations/connections-list";
import { SyncJobsTable } from "@/components/integrations/sync-jobs-table";
import { WebhookLogsTable } from "@/components/integrations/webhook-logs-table";
import { Button } from "@/components/ui/button";
import { PlugZap, RefreshCw, Webhook } from "lucide-react";

type Tab = "connections" | "sync" | "webhooks";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "connections", label: "Connections", icon: PlugZap },
  { id: "sync", label: "Sync Jobs", icon: RefreshCw },
  { id: "webhooks", label: "Webhook Logs", icon: Webhook },
];

export default function IntegrationsPage() {
  const [tab, setTab] = useState<Tab>("connections");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground text-sm">Connect and sync with Amazon, Shopify, Walmart, eBay and Veeqo</p>
      </div>

      <div className="flex gap-1 border-b border-border/50 pb-0">
        {tabs.map(t => (
          <Button
            key={t.id}
            variant="ghost"
            size="sm"
            onClick={() => setTab(t.id)}
            className={`gap-1.5 rounded-b-none border-b-2 transition-none ${
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </Button>
        ))}
      </div>

      <div className="pt-2">
        {tab === "connections" && <ConnectionsList />}
        {tab === "sync" && <SyncJobsTable />}
        {tab === "webhooks" && <WebhookLogsTable />}
      </div>
    </div>
  );
}
