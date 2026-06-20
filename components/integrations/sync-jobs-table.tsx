"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useReactTable, getCoreRowModel, flexRender, createColumnHelper,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MarketplaceIcon } from "./marketplace-icon";
import type { SyncJob, SyncJobStatus } from "@/types/integrations";
import type { Marketplace } from "@/types/listing";
import { Loader2, RefreshCw, CheckCircle2, XCircle, Clock, Activity } from "lucide-react";

const statusConfig: Record<SyncJobStatus, { label: string; icon: React.ElementType; className: string }> = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-zinc-800 text-zinc-300 border-zinc-700" },
  RUNNING: { label: "Running", icon: Activity, className: "bg-amber-950 text-amber-300 border-amber-800" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, className: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  FAILED: { label: "Failed", icon: XCircle, className: "bg-red-950 text-red-300 border-red-800" },
};

const col = createColumnHelper<SyncJob>();

export function SyncJobsTable() {
  const [data, setData] = useState<SyncJob[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/integrations/sync?page=${page}&limit=20`);
    const json = await res.json();
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    col.accessor("connection", {
      header: "Connection",
      cell: (i) => {
        const c = i.getValue();
        if (!c) return <span className="text-muted-foreground">—</span>;
        return (
          <div className="flex items-center gap-2">
            <MarketplaceIcon marketplace={c.marketplace as Marketplace} size="sm" />
            <span className="text-sm">{c.name}</span>
          </div>
        );
      },
    }),
    col.accessor("type", {
      header: "Type",
      cell: (i) => <Badge variant="outline" className="text-xs font-mono">{i.getValue()}</Badge>,
    }),
    col.accessor("status", {
      header: "Status",
      cell: (i) => {
        const s = i.getValue();
        const cfg = statusConfig[s] ?? statusConfig.PENDING;
        const Icon = cfg.icon;
        return (
          <Badge className={`border text-xs gap-1 ${cfg.className}`}>
            {s === "RUNNING" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className="h-3 w-3" />}
            {cfg.label}
          </Badge>
        );
      },
    }),
    col.accessor("itemsProcessed", {
      header: "Items",
      cell: (i) => {
        const processed = i.getValue();
        const total = i.row.original.itemsTotal;
        if (processed === null) return <span className="text-muted-foreground">—</span>;
        return <span className="tabular-nums text-sm">{processed}/{total ?? "?"}</span>;
      },
    }),
    col.accessor("startedAt", {
      header: "Started",
      cell: (i) => i.getValue() ? new Date(i.getValue()!).toLocaleString() : "—",
    }),
    col.accessor("completedAt", {
      header: "Duration",
      cell: (i) => {
        const start = i.row.original.startedAt;
        const end = i.getValue();
        if (!start || !end) return <span className="text-muted-foreground">—</span>;
        const ms = new Date(end).getTime() - new Date(start).getTime();
        return <span className="text-sm tabular-nums">{(ms / 1000).toFixed(1)}s</span>;
      },
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
                  <Activity className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No sync jobs yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Activate a connection and trigger a sync</p>
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
        <span>{total} jobs</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="ghost" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
