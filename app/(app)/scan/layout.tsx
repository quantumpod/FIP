import Link from "next/link";
import { ScanLine, LayoutDashboard } from "lucide-react";

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Minimal scanner topbar */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur px-4">
        <div className="flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm tracking-tight">Scanner Mode</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      </header>

      <div className="flex-1 pt-4">{children}</div>
    </div>
  );
}
