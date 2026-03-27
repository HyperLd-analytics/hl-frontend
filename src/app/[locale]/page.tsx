import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold md:text-5xl">Hyperliquid 链上数据分析平台</h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          为交易团队与个人量化投资者提供 Smart Money 追踪、清算监控、钱包画像与实时告警。
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild>
            <Link href="/dashboard">进入 Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pricing">查看定价</Link>
          </Button>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <Card>Smart Money 排行榜</Card>
        <Card>钱包深度分析</Card>
        <Card>清算热图与告警</Card>
      </section>
    </main>
  );
}
