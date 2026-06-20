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
import { OrderStatusBadge } from "./order-status-badge";
import { MarketplaceBadge } from "@/components/listings/marketplace-badge";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShoppingCart,
  Eye,
  Pencil,
  Package,
} from "lucide-react";
import type { Order, OrderStatus } from "@/types/order";
import type { Marketplace } from "@/types/listing";

const STATUSES: OrderStatus[] = ["NEW", "READY_TO_PICK", "PICKING", "PACKED", "SHIPPED", "CANCELLED"];
const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "New",
  READY_TO_PICK: "Ready to Pick",
  PICKING: "Picking",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  CANCELLED: "Cancelled",
};

interface OrderListResponse {
  data: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export function OrdersTable() {
  const [data, setData] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("query", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/orders?${params}`);
      const json: OrderListResponse = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput === "" || searchInput.length >= 3) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function handleStatusSave() {
    if (!editOrder) return;
    setSaving(true);
    try {
      await fetch(`/api/orders/${editOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus }),
      });
      setEditOrder(null);
      fetchOrders();
    } finally {
      setSaving(false);
    }
  }

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "orderNumber",
      header: "Order #",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm font-medium">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: "marketplace",
      header: "Marketplace",
      cell: ({ row }) => (
        <MarketplaceBadge marketplace={row.original.marketplace as Marketplace} />
      ),
    },
    {
      accessorKey: "trackingNumber",
      header: "Tracking",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-muted-foreground">
          {getValue<string | null>() ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.original.items?.length ?? 0}
        </span>
      ),
    },
    {
      id: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
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
            onClick={() => setViewOrder(row.original)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setEditOrder(row.original);
              setEditStatus(row.original.status);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
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
            placeholder="Search order #, tracking… (min 3 chars)"
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
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v === "__all__" ? "" : (v ?? ""));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No orders found</p>
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
        <span>{total} order{total !== 1 ? "s" : ""}</span>
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

      {/* View Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={(o) => !o && setViewOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono">Order #{viewOrder?.orderNumber}</DialogTitle>
            <DialogDescription>{viewOrder && <OrderStatusBadge status={viewOrder.status} />}</DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Marketplace</p>
                  <MarketplaceBadge marketplace={viewOrder.marketplace as Marketplace} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tracking</p>
                  <p className="font-mono">{viewOrder.trackingNumber ?? "—"}</p>
                </div>
                {viewOrder.carrier && (
                  <div>
                    <p className="text-xs text-muted-foreground">Carrier</p>
                    <p>{viewOrder.carrier}</p>
                  </div>
                )}
                {viewOrder.externalOrderId && (
                  <div>
                    <p className="text-xs text-muted-foreground">External ID</p>
                    <p className="font-mono text-xs">{viewOrder.externalOrderId}</p>
                  </div>
                )}
              </div>
              {viewOrder.items && viewOrder.items.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">Items</p>
                  <div className="space-y-1.5">
                    {viewOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded border border-border/50 px-3 py-2">
                        <div>
                          <span className="font-mono text-sm font-medium">{item.product?.masterSku ?? "—"}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{item.product?.name}</span>
                        </div>
                        <span className="text-sm tabular-nums">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {viewOrder.pickTasks && viewOrder.pickTasks.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Package className="h-3 w-3" /> Pick Tasks ({viewOrder.pickTasks.length})
                  </p>
                  <div className="space-y-1">
                    {viewOrder.pickTasks.map((pt) => (
                      <div key={pt.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{pt.id.slice(0, 8)}…</span>
                        <span>{pt.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={!!editOrder} onOpenChange={(o) => !o && setEditOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription className="font-mono">#{editOrder?.orderNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Select value={editStatus} onValueChange={(v) => setEditStatus(v ?? editStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-3">
              <Button onClick={handleStatusSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditOrder(null)} disabled={saving}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
