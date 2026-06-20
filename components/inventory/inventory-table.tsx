"use client";

import { useState, useCallback, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdjustInventoryForm } from "./adjust-inventory-form";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Warehouse,
} from "lucide-react";
import type { InventoryItem } from "@/types/inventory";

interface InventoryListResponse {
  data: InventoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

export function InventoryTable() {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("query", search);
      const res = await fetch(`/api/inventory?${params}`);
      const json: InventoryListResponse = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === "" || searchInput.length >= 3) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function handleDelete() {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      await fetch(`/api/inventory/${deleteItem.id}`, { method: "DELETE" });
      setDeleteItem(null);
      fetchInventory();
    } finally {
      setDeleting(false);
    }
  }

  function stockClass(qty: number) {
    if (qty <= 0) return "text-red-400";
    if (qty < 10) return "text-amber-400";
    return "text-emerald-400";
  }

  const columns: ColumnDef<InventoryItem>[] = [
    {
      id: "masterSku",
      header: "Master SKU",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">{row.original.product?.masterSku ?? "—"}</span>
      ),
    },
    {
      id: "productName",
      header: "Product",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.product?.name ?? "—"}</span>
      ),
    },
    {
      id: "location",
      header: "Location",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.location?.code ?? "—"}</span>
      ),
    },
    {
      id: "warehouse",
      header: "Warehouse",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {(row.original.location as { warehouse?: { code?: string } } | undefined)?.warehouse?.code ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "onHand",
      header: "On Hand",
      cell: ({ getValue }) => (
        <span className={`text-sm font-medium tabular-nums ${stockClass(getValue<number>())}`}>
          {getValue<number>()}
        </span>
      ),
    },
    {
      accessorKey: "allocated",
      header: "Allocated",
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums text-muted-foreground">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "available",
      header: "Available",
      cell: ({ getValue }) => (
        <span className={`text-sm font-semibold tabular-nums ${stockClass(getValue<number>())}`}>
          {getValue<number>()}
        </span>
      ),
    },
    {
      accessorKey: "lotNumber",
      header: "Lot",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">{getValue<string | null>() ?? "—"}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditItem(row.original)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeleteItem(row.original)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search by SKU, location… (min 3)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput.length > 0 && searchInput.length < 3 && (
            <p className="absolute -bottom-5 left-0 text-xs text-muted-foreground">Type at least 3 characters</p>
          )}
        </div>
        <Button onClick={() => setAdjustOpen(true)} className="ml-auto">
          <Plus className="h-4 w-4" />
          Adjust Stock
        </Button>
      </div>

      <div className="rounded-md border border-border/50">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center">
                  <Warehouse className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No inventory records found</p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} record{total !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>{page} / {totalPages}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Adjust Stock Dialog */}
      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>Set on-hand quantity for a product at a location</DialogDescription>
          </DialogHeader>
          <AdjustInventoryForm
            onSuccess={() => { setAdjustOpen(false); fetchInventory(); }}
            onCancel={() => setAdjustOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Stock</DialogTitle>
            <DialogDescription className="font-mono">
              {editItem?.product?.masterSku} @ {editItem?.location?.code}
            </DialogDescription>
          </DialogHeader>
          {editItem && (
            <AdjustInventoryForm
              item={editItem}
              onSuccess={() => { setEditItem(null); fetchInventory(); }}
              onCancel={() => setEditItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Inventory Record</DialogTitle>
            <DialogDescription>
              Remove{" "}
              <span className="font-mono font-medium">{deleteItem?.product?.masterSku}</span>{" "}
              from{" "}
              <span className="font-mono font-medium">{deleteItem?.location?.code}</span>?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Remove
            </Button>
            <Button variant="ghost" onClick={() => setDeleteItem(null)} disabled={deleting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
