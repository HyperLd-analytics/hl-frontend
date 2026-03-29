"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, BellRing, Brain,Calculator, CreditCard, Flame, LayoutGrid,Star,GitCompare, Home, Key, Menu, TrendingUp, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

function navPathActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/zh-CN/dashboard" || pathname === "/en/dashboard";
  }
  if (pathname === href) return true;
  for (const prefix of ["/zh-CN", "/en"]) {
    const localized = `${prefix}${href}`;
    if (pathname === localized || pathname.startsWith(`${localized}/`)) return true;
  }
  return pathname.startsWith(`${href}/`);
}

const navItems = [
  { href: "/dashboard", label: "总览", icon: Home },
  { href: "/dashboard/hypertracker", label: "Hypertracker", icon: TrendingUp },
  { href: "/dashboard/segments", label: "  Segments", icon: Users },
  { href: "/dashboard/leaderboard", label: "Smart Money 排行榜", icon: BarChart3 },
  { href: "/dashboard/metrics", label: "自定义指标", icon: Calculator },
  { href: "/dashboard/analytics", label: "高级图表分析", icon: Activity },
  { href: "/dashboard/ai", label: "AI 智能分析", icon: Brain },
  { href: "/dashboard/compare", label: "钱包对比", icon: GitCompare },
  { href: "/dashboard/position-heatmap", label: "仓位热图", icon: LayoutGrid },
  { href: "/dashboard/perps", label: "合约中心", icon: LayoutGrid },
  { href: "/dashboard/liquidations", label: "清算热图", icon: Flame },
  { href: "/dashboard/alerts", label: "告警配置", icon: BellRing },
  { href: "/dashboard/favorites", label: "收藏夹", icon: Star },
  { href: "/dashboard/api-keys", label: "API 开放平台", icon: Key },
  { href: "/dashboard/billing", label: "订阅与账单", icon: CreditCard },
  { href: "/dashboard/wallet/0x1234...abcd", label: "钱包分析示例", icon: Wallet }
];

function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-72 flex-col border-r border-border bg-card p-4">
      <Link href="/" className="mb-6 flex items-center gap-2 text-lg font-semibold">
        <div className="h-8 w-8 rounded-md bg-primary" />
        <span>Hyperliquid Lens</span>
      </Link>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = navPathActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <Separator className="mb-4 mt-6" />
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>HL</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">Demo User</p>
            <p className="text-xs text-muted-foreground">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}

type SidebarProps = {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  username?: string | null;
  userId?: string;
};

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  return (
    <>
      <aside className="hidden md:block">
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed left-0 top-0 z-50 h-full md:hidden">
            <SidebarContent />
          </div>
        </>
      )}
      <Button variant="outline" size="sm" className="fixed left-4 top-3 z-30 md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
        <Menu className="h-4 w-4" />
      </Button>
    </>
  );
}
