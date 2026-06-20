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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarketplaceBadge } from "./marketplace-badge";
import { ListingForm } from "./listing-form";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, PackageSearch } from "lucide-react";
import type { Listing, Marketplace } from "@/types/listing";

const MARKETPLACES = ["AMAZON", "WALMART", "EBAY", "SHOPIFY", "VEEQO"] as const;

interface ListingListResponse {
  data: Listing[];
  total: number;
  page: number;
  totalPages: number;
}

export function ListingsTable() {
  const [data, setData] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [deleteListing, setDeleteListing] = useState<Listing | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("query", search);
      if (marketplaceFilter) params.set("marketplace", marketplaceFilter);

      const res = await fetch(`/api/listings?${params}`);
      const json: ListingListResponse = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, marketplaceFilter]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput === "" || searchInput.length >= 3) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function handleDelete() {
    if (!deleteListing) return;
    setDeleting(true);
    try {
      await fetch(`/api/listings/${deleteListing.id}`, { method: "DELETE" });
      setDeleteListing(null);
      fetchListings();
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<Listing>[] = [
    {
      accessorKey: "marketplace",
      header: "Marketplace",
      cell: ({ row }) => <MarketplaceBadge marketplace={row.original.marketplace as Marketplace} />,
    },
    {
      accessorKey: "sellerSku",
      header: "Seller SKU",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue<string>()}</span>
      ),
    },
    {
      id: "masterSku",
      header: "Master SKU",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.original.product?.masterSku ?? "—"}
        </span>
      ),
    },
    {
      id: "productName",
      header: "Product",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.product?.name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "bundleQty",
      header: "Bundle Qty",
      cell: ({ getValue }) => (
        <span className="text-sm tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      accessorKey: "asin",
      header: "ASIN",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">{getValue<string | null>() ?? "—"}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => setEditListing(row.original)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeleteListing(row.original)}
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
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search by SKU, ASIN… (min 3 chars)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput.length > 0 && searchInput.length < 3 && (
            <p className="absolute -bottom-5 left-0 text-xs text-muted-foreground">
              Type at least 3 characters
            </p>
          )}
        </div>

        <Select
          value={marketplaceFilter}
          onValueChange={(v) => {
            setMarketplaceFilter(v === "__all__" ? "" : (v ?? ""));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Marketplaces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Marketplaces</SelectItem>
            {MARKETPLACES.map((m) => (
              <SelectItem key={m} value={m}>
                {m.charAt(0) + m.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setCreateOpen(true)} className="ml-auto">
          <Plus className="h-4 w-4" />
          New Listing
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border/50">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
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
                  <PackageSearch className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No listings found</p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/30">
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

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} listing{total !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            {page} / {totalPages}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>New Listing</DialogTitle>
            <DialogDescription>Map a marketplace Seller SKU to a Master SKU</DialogDescription>
          </DialogHeader>
          <ListingForm
            onSuccess={() => { setCreateOpen(false); fetchListings(); }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editListing} onOpenChange={(o) => !o && setEditListing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
            <DialogDescription>{editListing?.sellerSku}</DialogDescription>
          </DialogHeader>
          {editListing && (
            <ListingForm
              listing={editListing}
              onSuccess={() => { setEditListing(null); fetchListings(); }}
              onCancel={() => setEditListing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteListing} onOpenChange={(o) => !o && setDeleteListing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-mono font-medium">{deleteListing?.sellerSku}</span>?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
            <Button variant="ghost" onClick={() => setDeleteListing(null)} disabled={deleting}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
