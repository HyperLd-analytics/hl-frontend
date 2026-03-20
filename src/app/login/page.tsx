"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { setAccessTokenCookie } from "@/lib/auth";
import { useApi } from "@/hooks/use-api";
import { PageError } from "@/components/common/page-error";

export default function LoginPage() {
  const { request, loading, error } = useApi();
  const [email, setEmail] = useState("demo@hyperliquidlens.com");
  const [password, setPassword] = useState("123456");
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const onLogin = async () => {
    try {
      const res = await request<{ accessToken: string }>({
        path: "/auth/login",
        method: "POST",
        body: JSON.stringify({ email, password })
      });

      setAccessTokenCookie(res.accessToken);
      router.push(redirect);
    } catch {
      // 错误已由 useApi 统一接管
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">登录 Hyperliquid Lens</h1>
        <p className="text-sm text-muted-foreground">先用账号密码登录，后续可扩展 OAuth 或钱包签名。</p>
        <input
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="邮箱"
        />
        <input
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密码"
        />
        <Button className="w-full" onClick={onLogin} disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </Button>
        {error && <PageError title="登录失败" message={error.message} />}
      </Card>
    </main>
  );
}
