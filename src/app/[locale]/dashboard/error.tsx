"use client";

import { PageError } from "@/components/common/page-error";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: ErrorPageProps) {
  return <PageError message={error.message} onRetry={reset} />;
}
