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
import { LocationForm } from "./location-form";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, MapPin } from "lucide-react";
import type { Location } from "@/types/inventory";

interface LocationListResponse {
  data: (Location & { _count?: { inventoryItems: number } })[];
  total: number;
  page: number;
  totalPages: number;
}

export function LocationsTable() {
  const [data, setData] = useState<(Location & { _count?: { inventoryItems: number } })[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);
  const [deleteLocation, setDeleteLocation] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("query", search);
      const res = await fetch(`/api/locations?${params}`);
      const json: LocationListResponse = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

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
    if (!deleteLocation) return;
    setDeleting(true);
    try {
      await fetch(`/api/locations/${deleteLocation.id}`, { method: "DELETE" });
      setDeleteLocation(null);
      fetchLocations();
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<Location & { _count?: { inventoryItems: number } }>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm font-medium">{getValue<string>()}</span>
      ),
    },
    {
      id: "warehouse",
      header: "Warehouse",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.warehouse?.code ?? "—"}</span>
      ),
    },
    {
      accessorKey: "zone",
      header: "Zone",
      cell: ({ getValue }) => <span className="text-sm">{getValue<string | null>() ?? "—"}</span>,
    },
    {
      accessorKey: "aisle",
      header: "Aisle",
      cell: ({ getValue }) => <span className="text-sm">{getValue<string | null>() ?? "—"}</span>,
    },
    {
      accessorKey: "rack",
      header: "Rack",
      cell: ({ getValue }) => <span className="text-sm">{getValue<string | null>() ?? "—"}</span>,
    },
    {
      accessorKey: "bin",
      header: "Bin",
      cell: ({ getValue }) => <span className="text-sm">{getValue<string | null>() ?? "—"}</span>,
    },
    {
      id: "skus",
      header: "SKUs",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.original._count?.inventoryItems ?? 0}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) =>
        getValue<boolean>() ? (
          <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Active</Badge>
        ) : (
          <Badge variant="outline" className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30">Inactive</Badge>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditLocation(row.original)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeleteLocation(row.original)}
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
            placeholder="Search by code, zone, aisle… (min 3)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput.length > 0 && searchInput.length < 3 && (
            <p className="absolute -bottom-5 left-0 text-xs text-muted-foreground">Type at least 3 characters</p>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)} className="ml-auto">
          <Plus className="h-4 w-4" />
          New Location
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
                  <MapPin className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No locations found</p>
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
        <span>{total} location{total !== 1 ? "s" : ""}</span>
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
            <DialogTitle>New Location</DialogTitle>
            <DialogDescription>Add a warehouse location (zone, aisle, rack, bin)</DialogDescription>
          </DialogHeader>
          <LocationForm onSuccess={() => { setCreateOpen(false); fetchLocations(); }} onCancel={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editLocation} onOpenChange={(o) => !o && setEditLocation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription className="font-mono">{editLocation?.code}</DialogDescription>
          </DialogHeader>
          {editLocation && (
            <LocationForm
              location={editLocation}
              onSuccess={() => { setEditLocation(null); fetchLocations(); }}
              onCancel={() => setEditLocation(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteLocation} onOpenChange={(o) => !o && setDeleteLocation(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Location</DialogTitle>
            <DialogDescription>
              Delete location <span className="font-mono font-medium">{deleteLocation?.code}</span>?
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
            <Button variant="ghost" onClick={() => setDeleteLocation(null)} disabled={deleting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
