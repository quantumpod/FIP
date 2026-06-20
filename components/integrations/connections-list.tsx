"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConnectorStatusBadge } from "./connector-status-badge";
import { MarketplaceIcon } from "./marketplace-icon";
import { ConnectionForm } from "./connection-form";
import type { MarketplaceConnection } from "@/types/integrations";
import type { Marketplace } from "@/types/listing";
import {
  Plus, Loader2, PlugZap, RefreshCw, Trash2, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";

export function ConnectionsList() {
  const [connections, setConnections] = useState<MarketplaceConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/integrations/connections");
    const json = await res.json();
    setConnections(Array.isArray(json) ? json : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(conn: MarketplaceConnection) {
    const newStatus = conn.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      const res = await fetch(`/api/integrations/connections/${conn.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success(newStatus === "ACTIVE" ? "Connection activated" : "Connection deactivated");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  async function deleteConn(conn: MarketplaceConnection) {
    if (!confirm(`Delete "${conn.name}"? This will remove all sync jobs and webhook logs.`)) return;
    try {
      const res = await fetch(`/api/integrations/connections/${conn.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success("Connection deleted");
      load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  }

  async function triggerSync(conn: MarketplaceConnection, type: string) {
    setSyncing(conn.id + type);
    try {
      const res = await fetch("/api/integrations/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: conn.id, type }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      toast.success(`${type} sync started — check Sync Jobs tab`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSyncing(null);
      setTimeout(load, 3000); // refresh after simulated sync
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />} className="gap-2">
            <Plus className="h-4 w-4" /> Add Connection
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add Marketplace Connection</DialogTitle></DialogHeader>
            <ConnectionForm onSuccess={() => { setCreateOpen(false); load(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {connections.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
          <PlugZap className="h-10 w-10 opacity-20 mb-3" />
          <p className="text-sm">No marketplace connections yet</p>
          <p className="text-xs opacity-60 mt-1">Connect Amazon, Shopify, eBay, Walmart or Veeqo to start syncing</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {connections.map(conn => (
            <Card key={conn.id} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <MarketplaceIcon marketplace={conn.marketplace as Marketplace} />
                    <div>
                      <p className="font-semibold text-sm">{conn.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{conn.marketplace.toLowerCase()}</p>
                    </div>
                  </div>
                  <ConnectorStatusBadge status={conn.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {conn.lastSyncAt && (
                  <p className="text-xs text-muted-foreground">
                    Last sync: {new Date(conn.lastSyncAt).toLocaleString()}
                  </p>
                )}

                {/* Sync actions */}
                {conn.status === "ACTIVE" && (
                  <div className="flex flex-wrap gap-1.5">
                    {(["ORDERS", "INVENTORY", "LISTINGS"] as const).map(type => (
                      <Button
                        key={type}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        disabled={syncing === conn.id + type}
                        onClick={() => triggerSync(conn, type)}
                      >
                        {syncing === conn.id + type
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <RefreshCw className="h-3 w-3" />
                        }
                        Sync {type.charAt(0) + type.slice(1).toLowerCase()}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Toggle + Delete */}
                <div className="flex items-center justify-between pt-1 border-t border-border/40">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1"
                    onClick={() => toggleStatus(conn)}
                  >
                    {conn.status === "ACTIVE"
                      ? <><XCircle className="h-3.5 w-3.5" /> Deactivate</>
                      : <><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Activate</>
                    }
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive gap-1"
                    onClick={() => deleteConn(conn)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Webhook URL info */}
      <div className="rounded-md border border-border/50 bg-muted/10 p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Webhook Endpoints</p>
        {(["amazon", "shopify", "walmart", "ebay", "veeqo"] as const).map(mp => (
          <div key={mp} className="flex items-center gap-2">
            <code className="text-xs font-mono text-muted-foreground bg-muted/30 px-2 py-0.5 rounded">
              POST /api/integrations/webhooks/{mp.toUpperCase()}
            </code>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">Configure these URLs in your marketplace developer portal. Set <code className="font-mono">x-webhook-event</code> header with the event type.</p>
      </div>
    </div>
  );
}
