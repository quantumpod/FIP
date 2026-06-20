"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useReactTable, getCoreRowModel, flexRender, createColumnHelper,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PalletDetail } from "./pallet-detail";
import { PalletForm } from "./pallet-form";
import type { Pallet } from "@/types/warehouse-ops";
import { Plus, Loader2, Package, Eye, Lock } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";

const col = createColumnHelper<Pallet>();

export function PalletsTable() {
  const [data, setData] = useState<Pallet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Pallet | null>(null);
  const debouncedQuery = useDebounce(query, 400);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({ page: String(page), limit: "20" });
    if (debouncedQuery.length >= 3) sp.set("query", debouncedQuery);
    const res = await fetch(`/api/pallets?${sp}`);
    const json = await res.json();
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, debouncedQuery]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    col.accessor("code", {
      header: "Pallet Code",
      cell: (i) => <span className="font-mono font-medium">{i.getValue()}</span>,
    }),
    col.accessor("warehouse", {
      header: "Warehouse",
      cell: (i) => i.getValue()?.code ?? "—",
    }),
    col.accessor("location", {
      header: "Location",
      cell: (i) => i.getValue()?.code ?? <span className="text-muted-foreground">—</span>,
    }),
    col.accessor("isSealed", {
      header: "Status",
      cell: (i) => i.getValue()
        ? <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-xs border gap-1"><Lock className="h-3 w-3" />Sealed</Badge>
        : <Badge variant="outline" className="text-xs">Open</Badge>,
    }),
    col.accessor("items", {
      header: "Items",
      cell: (i) => {
        const items = i.getValue();
        const totalQty = items.reduce((s, it) => s + it.quantity, 0);
        return <span className="tabular-nums text-sm">{items.length} SKUs · {totalQty} units</span>;
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
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search pallet code…"
          value={query}
          onChange={e => { setQuery(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />} className="gap-2">
            <Plus className="h-4 w-4" /> New Pallet
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Pallet</DialogTitle></DialogHeader>
            <PalletForm onSuccess={() => { setCreateOpen(false); load(); }} />
          </DialogContent>
        </Dialog>
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
                  <Package className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No pallets found</p>
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
        <span>{total} pallets</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="ghost" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {selected && (
        <Dialog open={!!selected} onOpenChange={o => { if (!o) setSelected(null); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Pallet — {selected.code}</DialogTitle></DialogHeader>
            <PalletDetail pallet={selected} onUpdate={u => { setSelected(u); load(); }} onDelete={() => { setSelected(null); load(); }} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
