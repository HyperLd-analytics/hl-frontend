"use client";

import { Button } from "@/components/ui/button";

type PageErrorProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function PageError({ title = "页面加载失败", message = "请稍后重试", onRetry }: PageErrorProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button className="mt-4" onClick={onRetry}>
          重试
        </Button>
      )}
    </div>
  );
}
