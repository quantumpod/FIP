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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PackagingRuleForm } from "./packaging-rule-form";
import { PackagingRecommender } from "./packaging-recommender";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, Box, Sparkles } from "lucide-react";
import type { PackagingRule } from "@/types/packaging";

interface PackagingListResponse {
  data: PackagingRule[];
  total: number;
  page: number;
  totalPages: number;
}

export function PackagingRulesTable() {
  const [data, setData] = useState<PackagingRule[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editRule, setEditRule] = useState<PackagingRule | null>(null);
  const [deleteRule, setDeleteRule] = useState<PackagingRule | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [recommenderOpen, setRecommenderOpen] = useState(false);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (search) params.set("query", search);
      const res = await fetch(`/api/packaging-rules?${params}`);
      const json: PackagingListResponse = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

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
    if (!deleteRule) return;
    setDeleting(true);
    try {
      await fetch(`/api/packaging-rules/${deleteRule.id}`, { method: "DELETE" });
      setDeleteRule(null);
      fetchRules();
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<PackagingRule>[] = [
    {
      accessorKey: "boxCode",
      header: "Box Code",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm font-bold">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ getValue }) => <span className="text-sm">{getValue<string>()}</span>,
    },
    {
      id: "scope",
      header: "Scope",
      cell: ({ row }) =>
        row.original.product ? (
          <Badge variant="outline" className="bg-blue-500/15 text-blue-400 border-blue-500/30 font-mono text-xs">
            {row.original.product.masterSku}
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-xs">
            Global
          </Badge>
        ),
    },
    {
      id: "qtyRange",
      header: "Qty Range",
      cell: ({ row }) => {
        const { minQty, maxQty } = row.original;
        if (!minQty && !maxQty) return <span className="text-sm text-muted-foreground">Any</span>;
        return (
          <span className="text-sm tabular-nums">
            {minQty ?? "—"} – {maxQty ?? "∞"}
          </span>
        );
      },
    },
    {
      id: "dimensions",
      header: "Dimensions (in)",
      cell: ({ row }) => {
        const { length, width, height } = row.original;
        if (!length && !width && !height) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <span className="text-sm tabular-nums text-muted-foreground">
            {length ?? "?"} × {width ?? "?"} × {height ?? "?"}
          </span>
        );
      },
    },
    {
      accessorKey: "weightLimit",
      header: "Max Weight (lb)",
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {getValue<number | null>() ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditRule(row.original)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeleteRule(row.original)}
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
            placeholder="Search by name, box code… (min 3)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput.length > 0 && searchInput.length < 3 && (
            <p className="absolute -bottom-5 left-0 text-xs text-muted-foreground">Type at least 3 characters</p>
          )}
        </div>
        <Button variant="outline" onClick={() => setRecommenderOpen(true)}>
          <Sparkles className="h-4 w-4" />
          Recommend Box
        </Button>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          New Rule
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
                  <Box className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No packaging rules found</p>
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
        <span>{total} rule{total !== 1 ? "s" : ""}</span>
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Packaging Rule</DialogTitle>
            <DialogDescription>Define a box recommendation by product and quantity range</DialogDescription>
          </DialogHeader>
          <PackagingRuleForm onSuccess={() => { setCreateOpen(false); fetchRules(); }} onCancel={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRule} onOpenChange={(o) => !o && setEditRule(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Packaging Rule</DialogTitle>
            <DialogDescription className="font-mono">{editRule?.boxCode}</DialogDescription>
          </DialogHeader>
          {editRule && (
            <PackagingRuleForm
              rule={editRule}
              onSuccess={() => { setEditRule(null); fetchRules(); }}
              onCancel={() => setEditRule(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteRule} onOpenChange={(o) => !o && setDeleteRule(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Packaging Rule</DialogTitle>
            <DialogDescription>
              Delete rule <span className="font-mono font-medium">{deleteRule?.boxCode}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
            <Button variant="ghost" onClick={() => setDeleteRule(null)} disabled={deleting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={recommenderOpen} onOpenChange={setRecommenderOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Box Recommender
            </DialogTitle>
            <DialogDescription>Find the best box for a product and quantity</DialogDescription>
          </DialogHeader>
          <PackagingRecommender />
        </DialogContent>
      </Dialog>
    </div>
  );
}
