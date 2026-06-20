"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useReactTable, getCoreRowModel, flexRender, createColumnHelper,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MarketplaceIcon } from "./marketplace-icon";
import type { WebhookLog } from "@/types/integrations";
import type { Marketplace } from "@/types/listing";
import { Loader2, RefreshCw, Webhook } from "lucide-react";

const statusClass: Record<string, string> = {
  RECEIVED: "bg-zinc-800 text-zinc-300 border-zinc-700",
  PROCESSED: "bg-emerald-950 text-emerald-300 border-emerald-800",
  FAILED: "bg-red-950 text-red-300 border-red-800",
};

const col = createColumnHelper<WebhookLog>();

export function WebhookLogsTable() {
  const [data, setData] = useState<WebhookLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WebhookLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/integrations/webhooks?page=${page}&limit=20`);
    const json = await res.json();
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    col.accessor("marketplace", {
      header: "Marketplace",
      cell: (i) => (
        <div className="flex items-center gap-2">
          <MarketplaceIcon marketplace={i.getValue() as Marketplace} size="sm" />
          <span className="text-xs capitalize">{i.getValue().toLowerCase()}</span>
        </div>
      ),
    }),
    col.accessor("event", {
      header: "Event",
      cell: (i) => <code className="text-xs font-mono bg-muted/30 px-1.5 py-0.5 rounded">{i.getValue()}</code>,
    }),
    col.accessor("status", {
      header: "Status",
      cell: (i) => <Badge className={`border text-xs ${statusClass[i.getValue()] ?? statusClass.RECEIVED}`}>{i.getValue()}</Badge>,
    }),
    col.accessor("connection", {
      header: "Connection",
      cell: (i) => i.getValue()?.name ?? <span className="text-muted-foreground">—</span>,
    }),
    col.accessor("createdAt", {
      header: "Received",
      cell: (i) => <span className="text-xs text-muted-foreground">{new Date(i.getValue()).toLocaleString()}</span>,
    }),
    col.display({
      id: "actions",
      header: "",
      cell: (i) => (
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(i.row.original)}>
          Payload
        </Button>
      ),
    }),
  ];

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={load} className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      <div className="rounded-md border border-border/50">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id} className="border-border/50 hover:bg-transparent">
                {hg.headers.map(h => (
                  <TableHead key={h.id} className="text-muted-foreground">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center">
                  <Webhook className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No webhook events yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Events will appear here when marketplaces send them</p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="border-border/50">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} events</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="ghost" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {selected && (
        <Dialog open={!!selected} onOpenChange={o => { if (!o) setSelected(null); }}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <code className="text-sm font-mono">{selected.event}</code>
                <Badge className={`border text-xs ${statusClass[selected.status] ?? statusClass.RECEIVED}`}>{selected.status}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-muted-foreground">Marketplace</p><p>{selected.marketplace}</p></div>
                <div><p className="text-xs text-muted-foreground">Received</p><p>{new Date(selected.createdAt).toLocaleString()}</p></div>
                {selected.connection && <div><p className="text-xs text-muted-foreground">Connection</p><p>{selected.connection.name}</p></div>}
                {selected.error && <div className="col-span-2"><p className="text-xs text-muted-foreground">Error</p><p className="text-red-400 text-xs font-mono">{selected.error}</p></div>}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Payload</p>
                <pre className="text-xs font-mono bg-muted/30 rounded-md p-3 overflow-x-auto whitespace-pre-wrap max-h-96">
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
