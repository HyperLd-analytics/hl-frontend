"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  useEffect(() => {
    // Register service worker when online
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore registration errors
      });
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 text-6xl">📡</div>
      <h1 className="text-2xl font-bold">网络连接已断开</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        无法连接服务器，请检查您的网络连接后重试。
      </p>
      <Button
        className="mt-6"
        onClick={() => window.location.reload()}
      >
        重新加载
      </Button>
    </main>
  );
}
