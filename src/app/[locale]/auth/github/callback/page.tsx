"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAccessTokenCookie } from "@/lib/auth";
import { useApi } from "@/hooks/use-api";

function GitHubCallbackInner() {
  const { request } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  useEffect(() => {
    const handleCallback = async () => {
      if (!code || !state) {
        router.push("/login?error=invalid_callback");
        return;
      }

      try {
        const res = await request<{ accessToken: string }>({
          path: `/auth/github/callback?code=${code}&state=${state}`,
          method: "GET"
        });
        setAccessTokenCookie(res.accessToken);
        router.push("/dashboard");
      } catch (err) {
        console.error("GitHub callback failed:", err);
        router.push("/login?error=auth_failed");
      }
    };

    handleCallback();
  }, [code, state, request, router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <p>正在处理 GitHub 登录...</p>
    </main>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center px-4">加载中...</main>}>
      <GitHubCallbackInner />
    </Suspense>
  );
}