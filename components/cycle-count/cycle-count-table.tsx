"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useReactTable, getCoreRowModel, flexRender, createColumnHelper,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CycleCountStatusBadge } from "./cycle-count-status-badge";
import { CycleCountForm } from "./cycle-count-form";
import { CycleCountDetail } from "./cycle-count-detail";
import type { CycleCount } from "@/types/warehouse-ops";
import { Plus, Loader2, ClipboardCheck, Eye } from "lucide-react";

const col = createColumnHelper<CycleCount>();

export function CycleCountTable() {
  const [data, setData] = useState<CycleCount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<CycleCount | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/cycle-counts?page=${page}&limit=20`);
    const json = await res.json();
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    col.accessor("warehouse", {
      header: "Warehouse",
      cell: (i) => i.getValue()?.code ?? "—",
    }),
    col.accessor("status", {
      header: "Status",
      cell: (i) => <CycleCountStatusBadge status={i.getValue()} />,
    }),
    col.accessor("items", {
      header: "Progress",
      cell: (i) => {
        const items = i.getValue();
        const counted = items.filter((it) => it.countedQty !== null).length;
        return <span className="tabular-nums text-sm">{counted}/{items.length}</span>;
      },
    }),
    col.accessor("items", {
      id: "variances",
      header: "Variances",
      cell: (i) => {
        const v = i.getValue().filter((it) => it.variance !== null && it.variance !== 0).length;
        return v > 0 ? (
          <span className="text-amber-400 font-medium">{v} items</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
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
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />} className="gap-2">
            <Plus className="h-4 w-4" /> New Cycle Count
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Cycle Count</DialogTitle></DialogHeader>
            <CycleCountForm onSuccess={() => { setCreateOpen(false); load(); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border/50">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="border-border/50 hover:bg-transparent">
                {hg.headers.map((h) => (
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
                  <ClipboardCheck className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No cycle counts found</p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-border/50">
                  {row.getVisibleCells().map((cell) => (
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
        <span>{total} counts</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="ghost" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {selected && (
        <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Cycle Count</DialogTitle></DialogHeader>
            <CycleCountDetail
              cycleCount={selected}
              onUpdate={(u) => { setSelected(u); load(); }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
