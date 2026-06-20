"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useReactTable, getCoreRowModel, flexRender, createColumnHelper,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PutawayStatusBadge } from "./putaway-status-badge";
import { PutawayDetail } from "./putaway-detail";
import type { PutawayTask } from "@/types/warehouse-ops";
import { Loader2, ArrowDownToLine, Eye } from "lucide-react";

const col = createColumnHelper<PutawayTask>();

export function PutawayTable() {
  const [data, setData] = useState<PutawayTask[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PutawayTask | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/putaway?page=${page}&limit=20`);
    const json = await res.json();
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    col.accessor("receivingOrder", {
      header: "PO Number",
      cell: (i) => <span className="font-mono">{i.getValue()?.poNumber ?? "—"}</span>,
    }),
    col.accessor("status", {
      header: "Status",
      cell: (i) => <PutawayStatusBadge status={i.getValue()} />,
    }),
    col.accessor("items", {
      header: "Progress",
      cell: (i) => {
        const items = i.getValue();
        const done = items.filter(it => it.putawayQty >= it.quantity).length;
        return <span className="tabular-nums text-sm">{done}/{items.length}</span>;
      },
    }),
    col.accessor("createdAt", {
      header: "Created",
      cell: (i) => new Date(i.getValue()).toLocaleDateString(),
    }),
    col.display({
      id: "actions",
      header: "",
      cell: (i) => (
        <Button size="sm" variant="ghost" onClick={() => setSelected(i.row.original)}>
          <Eye className="h-4 w-4 mr-1" /> View
        </Button>
      ),
    }),
  ];

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
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
                  <ArrowDownToLine className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No putaway tasks yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Generate from a completed Receiving Order</p>
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
        <span>{total} tasks</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="ghost" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {selected && (
        <Dialog open={!!selected} onOpenChange={o => { if (!o) setSelected(null); }}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Putaway Task</DialogTitle></DialogHeader>
            <PutawayDetail task={selected} onUpdate={u => { setSelected(u); load(); }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
