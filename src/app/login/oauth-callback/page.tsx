"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { setAccessTokenCookie } from "@/lib/auth";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const provider = searchParams.get("provider");

    if (!token) {
      setError("OAuth 登录失败：未获取到访问令牌");
      return;
    }

    // 存储 access token
    setAccessTokenCookie(token);
    // 重定向到 dashboard
    router.push("/dashboard");
  }, [searchParams, router]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-sm p-6 text-center space-y-4">
          <div className="text-red-500 text-lg font-medium">登录失败</div>
          <p className="text-sm text-muted-foreground">{error}</p>
          <a href="/login" className="text-primary text-sm hover:underline">
            返回登录页
          </a>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm p-6 text-center space-y-4">
        <div className="text-lg font-medium">登录中...</div>
        <p className="text-sm text-muted-foreground">
          正在完成 OAuth 授权，请稍候
        </p>
      </Card>
    </main>
  );
}
