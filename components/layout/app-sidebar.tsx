"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  ShoppingCart,
  Search,
  Warehouse,
  MapPin,
  ClipboardList,
  Box,
  Settings,
  ScanLine,
  PackageOpen,
  ArrowDownToLine,
  ClipboardCheck,
  Container,
  PlugZap,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const navGroups = [
  {
    label: "Operations",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Scanner Mode", href: "/scan", icon: ScanLine },
      { title: "Tracking Lookup", href: "/tracking", icon: Search },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { title: "Products", href: "/products", icon: Package },
      { title: "Listings", href: "/listings", icon: Tag },
      { title: "Orders", href: "/orders", icon: ShoppingCart },
    ],
  },
  {
    label: "Warehouse",
    items: [
      { title: "Receiving", href: "/receiving", icon: PackageOpen },
      { title: "Putaway", href: "/putaway", icon: ArrowDownToLine },
      { title: "Pick Tasks", href: "/pick-tasks", icon: ClipboardList },
      { title: "Cycle Counts", href: "/cycle-counts", icon: ClipboardCheck },
      { title: "Pallets", href: "/pallets", icon: Container },
    ],
  },
  {
    label: "Inventory",
    items: [
      { title: "Inventory", href: "/inventory", icon: Warehouse },
      { title: "Locations", href: "/locations", icon: MapPin },
      { title: "Packaging Rules", href: "/packaging-rules", icon: Box },
    ],
  },
  {
    label: "Integrations",
    items: [
      { title: "Integrations", href: "/integrations", icon: PlugZap },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Warehouse className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-none text-foreground">
              DockingWare
            </span>
            <span className="text-xs text-muted-foreground">FIP</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/settings" />} tooltip="Settings">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2 py-1">
          <Badge variant="outline" className="text-xs text-muted-foreground">
            MVP v0.1
          </Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
