import Link from "next/link";
import { TrendingUp, Users, BarChart3, ArrowRight } from "lucide-react";

export default function HypertrackerPage() {
  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hypertracker</h1>
        <p className="text-muted-foreground mt-1">
          追踪聪明钱动向，发现 money printer 钱包
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Money Printers</p>
              <p className="text-2xl font-semibold">+100%+ PnL</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            30天内收益超过100%的钱包
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit</p>
              <p className="text-2xl font-semibold">+10%~100% PnL</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            10% - 100% 收益区间的钱包
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-red-500 rotate-180" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rekt</p>
              <p className="text-2xl font-semibold">-50%~-10% PnL</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            亏损 10% - 50% 的钱包
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-600/10 p-2">
              <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Giga Rekt</p>
              <p className="text-2xl font-semibold">&lt;-50% PnL</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            亏损超过 50% 的钱包
          </p>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/dashboard/segments"
          className="group rounded-xl border bg-card p-6 hover:border-primary/50 hover:bg-card/80 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Segments</h3>
              <p className="text-sm text-muted-foreground">
                按盈亏分组查看钱包分布
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          href="/dashboard/leaderboard"
          className="group rounded-xl border bg-card p-6 hover:border-primary/50 hover:bg-card/80 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Smart Money 排行榜</h3>
              <p className="text-sm text-muted-foreground">
                按 Score 排序的钱包榜单
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* How it Works */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="font-semibold mb-4">如何划分 Segments？</h2>
        <div className="grid gap-3 md:grid-cols-5">
          {[
            { label: "Money Printer", desc: "PnL > +100%", color: "text-amber-500" },
            { label: "Profit", desc: "PnL +10% ~ +100%", color: "text-green-500" },
            { label: "Break Even", desc: "PnL -10% ~ +10%", color: "text-gray-400" },
            { label: "Rekt", desc: "PnL -50% ~ -10%", color: "text-red-500" },
            { label: "Giga Rekt", desc: "PnL < -50%", color: "text-red-600" },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-muted/50 p-3 text-center">
              <p className={`font-medium text-sm ${item.color}`}>{item.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
