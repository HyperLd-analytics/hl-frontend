"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Ignore SW errors in production
      });
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await (deferredPrompt as any).prompt();
    const result = await (deferredPrompt as any).userChoice;
    if (result.outcome === "accepted") {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card p-3 shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <p className="text-sm">安装 Hyperliquid Lens 应用，获取更好的移动端体验</p>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleInstall}>
            安装
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowInstallBanner(false)}>
            稍后
          </Button>
        </div>
      </div>
    </div>
  );
}
