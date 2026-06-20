"use client";

import { useEffect, useState, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { ReceivingStatusBadge } from "./receiving-status-badge";
import { ReceivingForm } from "./receiving-form";
import { ReceivingDetail } from "./receiving-detail";
import type { ReceivingOrder } from "@/types/warehouse-ops";
import { Plus, Loader2, PackageOpen, Eye } from "lucide-react";
import { useDebounce } from "@/lib/hooks/use-debounce";

const col = createColumnHelper<ReceivingOrder>();

export function ReceivingTable() {
  const [data, setData] = useState<ReceivingOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<ReceivingOrder | null>(null);
  const debouncedQuery = useDebounce(query, 400);

  const load = useCallback(async () => {
    setLoading(true);
    const sp = new URLSearchParams({ page: String(page), limit: "20" });
    if (debouncedQuery.length >= 3) sp.set("query", debouncedQuery);
    const res = await fetch(`/api/receiving?${sp}`);
    const json = await res.json();
    setData(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page, debouncedQuery]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    col.accessor("poNumber", {
      header: "PO Number",
      cell: (i) => <span className="font-mono font-medium">{i.getValue()}</span>,
    }),
    col.accessor("supplier", {
      header: "Supplier",
      cell: (i) => i.getValue() ?? <span className="text-muted-foreground">—</span>,
    }),
    col.accessor("warehouse", {
      header: "Warehouse",
      cell: (i) => i.getValue()?.code ?? "—",
    }),
    col.accessor("status", {
      header: "Status",
      cell: (i) => <ReceivingStatusBadge status={i.getValue()} />,
    }),
    col.accessor("items", {
      header: "Items",
      cell: (i) => {
        const items = i.getValue();
        const total = items.reduce((s, it) => s + it.expectedQty, 0);
        const received = items.reduce((s, it) => s + it.receivedQty, 0);
        return <span className="tabular-nums text-sm">{received}/{total}</span>;
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
          placeholder="Search PO number or supplier…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger render={<Button />} className="gap-2">
            <Plus className="h-4 w-4" /> New Receiving Order
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New Receiving Order</DialogTitle></DialogHeader>
            <ReceivingForm onSuccess={() => { setCreateOpen(false); load(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {query.length > 0 && query.length < 3 && (
        <p className="text-xs text-muted-foreground">Enter at least 3 characters to search</p>
      )}

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
                  <PackageOpen className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No receiving orders found</p>
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
        <span>{total} orders</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="ghost" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      </div>

      {selected && (
        <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Receiving Order — {selected.poNumber}</DialogTitle></DialogHeader>
            <ReceivingDetail
              order={selected}
              onUpdate={(updated) => {
                setSelected(updated);
                load();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
