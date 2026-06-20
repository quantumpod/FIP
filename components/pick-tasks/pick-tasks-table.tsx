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
import { PickTaskStatusBadge } from "./pick-task-status-badge";
import { MarketplaceBadge } from "@/components/listings/marketplace-badge";
import { PickTaskDetail } from "./pick-task-detail";
import { GeneratePickTaskForm } from "./generate-pick-task-form";
import {
  Plus,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ClipboardList,
} from "lucide-react";
import type { PickTask, PickTaskStatus } from "@/types/pick-task";
import type { Marketplace } from "@/types/listing";

const STATUSES: PickTaskStatus[] = ["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
const STATUS_LABELS: Record<PickTaskStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

interface PickTaskListResponse {
  data: PickTask[];
  total: number;
  page: number;
  totalPages: number;
}

export function PickTasksTable() {
  const [data, setData] = useState<PickTask[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewTask, setViewTask] = useState<PickTask | null>(null);
  const [deleteTask, setDeleteTask] = useState<PickTask | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("query", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/pick-tasks?${params}`);
      const json: PickTaskListResponse = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.totalPages ?? 1);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput === "" || searchInput.length >= 3) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function refreshView(taskId: string) {
    const res = await fetch(`/api/pick-tasks/${taskId}`);
    const updated: PickTask = await res.json();
    setViewTask(updated);
    fetchTasks();
  }

  async function handleDelete() {
    if (!deleteTask) return;
    setDeleting(true);
    try {
      await fetch(`/api/pick-tasks/${deleteTask.id}`, { method: "DELETE" });
      setDeleteTask(null);
      fetchTasks();
    } finally {
      setDeleting(false);
    }
  }

  const columns: ColumnDef<PickTask>[] = [
    {
      id: "taskId",
      header: "Task ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.id.slice(0, 10)}…</span>
      ),
    },
    {
      id: "order",
      header: "Order",
      cell: ({ row }) => (
        <span className="font-mono text-sm font-medium">{row.original.order?.orderNumber ?? "—"}</span>
      ),
    },
    {
      id: "marketplace",
      header: "Marketplace",
      cell: ({ row }) =>
        row.original.order?.marketplace ? (
          <MarketplaceBadge marketplace={row.original.order.marketplace as Marketplace} />
        ) : <span>—</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <PickTaskStatusBadge status={row.original.status} />,
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items ?? [];
        const picked = items.filter((i) => i.pickedQty >= i.quantity).length;
        return (
          <span className="text-sm tabular-nums text-muted-foreground">
            {picked}/{items.length}
          </span>
        );
      },
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
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewTask(row.original)}>
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeleteTask(row.original)}
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
            placeholder="Search by order #, tracking… (min 3)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput.length > 0 && searchInput.length < 3 && (
            <p className="absolute -bottom-5 left-0 text-xs text-muted-foreground">Type at least 3 characters</p>
          )}
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v === "__all__" ? "" : (v ?? "")); setPage(1); }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setGenerateOpen(true)} className="ml-auto">
          <Plus className="h-4 w-4" />
          Generate Task
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
                  <ClipboardList className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No pick tasks found</p>
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
        <span>{total} task{total !== 1 ? "s" : ""}</span>
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

      {/* Generate Dialog */}
      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Pick Task</DialogTitle>
            <DialogDescription>Select an order to generate a pick task from available inventory</DialogDescription>
          </DialogHeader>
          <GeneratePickTaskForm
            onSuccess={() => { setGenerateOpen(false); fetchTasks(); }}
            onCancel={() => setGenerateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View/Work Dialog */}
      <Dialog open={!!viewTask} onOpenChange={(o) => !o && setViewTask(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pick Task</DialogTitle>
            <DialogDescription className="font-mono">{viewTask?.order?.orderNumber}</DialogDescription>
          </DialogHeader>
          {viewTask && (
            <PickTaskDetail task={viewTask} onUpdate={() => refreshView(viewTask.id)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTask} onOpenChange={(o) => !o && setDeleteTask(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Pick Task</DialogTitle>
            <DialogDescription>
              Delete pick task for order{" "}
              <span className="font-mono font-medium">{deleteTask?.order?.orderNumber}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
            <Button variant="ghost" onClick={() => setDeleteTask(null)} disabled={deleting}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
