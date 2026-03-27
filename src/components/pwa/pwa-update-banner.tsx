"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function PWAUpdateBanner() {
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const reg = navigator.serviceWorker;
    if (!reg) return;
    reg.addEventListener("updatefound", () => {
      const newWorker = reg.controller;
      if (!newWorker) return;

      newWorker.addEventListener("statechange", () => {
        if (newWorker.state === "installed") {
          setWaiting(true);
        }
      });
    });
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (!waiting) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-primary px-4 py-2 text-primary-foreground">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <p className="text-sm font-medium">有新版本可用</p>
        <Button size="sm" variant="secondary" onClick={handleRefresh}>
          <RefreshCw className="mr-1 h-4 w-4" />
          刷新
        </Button>
      </div>
    </div>
  );
}
