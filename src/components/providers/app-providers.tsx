"use client";

import { ToastProvider } from "@/components/providers/toast-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
