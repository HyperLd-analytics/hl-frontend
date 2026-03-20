import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const plans = [
  { name: "Free", price: "$0/月", feature: "基础链上数据浏览" },
  { name: "Pro", price: "$49/月", feature: "排行榜 + 钱包深度分析 + 告警" },
  { name: "Team", price: "$199/月", feature: "多账户协作 + API 高配额" }
];

export default function PricingPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">定价方案</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className="space-y-3">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="text-2xl font-bold">{plan.price}</p>
            <p className="text-sm text-muted-foreground">{plan.feature}</p>
            <Button className="w-full">开始使用</Button>
          </Card>
        ))}
      </div>
    </main>
  );
}
