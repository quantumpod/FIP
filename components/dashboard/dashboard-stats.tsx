"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { PickTaskStatusBadge } from "@/components/pick-tasks/pick-task-status-badge";
import { MarketplaceBadge } from "@/components/listings/marketplace-badge";
import {
  ShoppingCart,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Loader2,
  ScanLine,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/types/order";
import type { PickTaskStatus } from "@/types/pick-task";
import type { Marketplace } from "@/types/listing";

interface DashboardData {
  stats: {
    totalOrders: number;
    readyToPick: number;
    openPickTasks: number;
    lowStockItems: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    marketplace: string;
    status: string;
    trackingNumber: string | null;
    createdAt: string;
    items: { quantity: number }[];
  }[];
  recentPickTasks: {
    id: string;
    status: string;
    updatedAt: string;
    order: { orderNumber: string; marketplace: string } | null;
    items: { quantity: number; pickedQty: number }[];
  }[];
}

export function DashboardStats() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      title: "Total Orders",
      value: data?.stats.totalOrders ?? "—",
      icon: ShoppingCart,
      color: "text-blue-400",
      description: "All time",
    },
    {
      title: "Ready to Pick",
      value: data?.stats.readyToPick ?? "—",
      icon: CheckCircle2,
      color: "text-emerald-400",
      description: "Pending action",
    },
    {
      title: "Open Pick Tasks",
      value: data?.stats.openPickTasks ?? "—",
      icon: ClipboardList,
      color: "text-amber-400",
      description: "In queue",
    },
    {
      title: "Low Stock Items",
      value: data?.stats.lowStockItems ?? "—",
      icon: AlertTriangle,
      color: "text-red-400",
      description: "≤10 units available",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm">Fulfillment Intelligence Platform</p>
        </div>
        <Link href="/scan">
          <Button className="gap-2">
            <ScanLine className="h-4 w-4" />
            Scanner Mode
          </Button>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <div className="text-2xl font-bold tabular-nums">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent rows */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !data?.recentOrders.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <MarketplaceBadge marketplace={order.marketplace as Marketplace} />
                      <span className="font-mono text-sm font-medium truncate">{order.orderNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} units
                      </span>
                      <OrderStatusBadge status={order.status as OrderStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Pick Tasks */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Recent Pick Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !data?.recentPickTasks.length ? (
              <div className="flex flex-col items-center py-8 text-center">
                <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No pick tasks yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentPickTasks.map((task) => {
                  const picked = task.items.filter((i) => i.pickedQty >= i.quantity).length;
                  const total = task.items.length;
                  return (
                    <div key={task.id} className="flex items-center justify-between gap-3 rounded-md border border-border/40 px-3 py-2.5">
                      <div className="min-w-0">
                        <span className="font-mono text-sm font-medium">{task.order?.orderNumber ?? "—"}</span>
                        <p className="text-xs text-muted-foreground">{picked}/{total} items picked</p>
                      </div>
                      <PickTaskStatusBadge status={task.status as PickTaskStatus} />
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
