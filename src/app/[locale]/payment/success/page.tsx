"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // 5秒后自动跳转到 dashboard
    const timer = setTimeout(() => {
      router.push("/dashboard");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md space-y-4 text-center">
        <div className="flex justify-center">
          <svg
            className="h-16 w-16 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">支付成功！</h1>
        <p className="text-muted-foreground">
          您的订阅已激活，感谢您的支持！
        </p>
        <p className="text-sm text-muted-foreground">
          5秒后将自动跳转到控制台...
        </p>
        <Button className="w-full" onClick={() => router.push("/dashboard")}>
          立即前往控制台
        </Button>
      </Card>
    </main>
  );
}