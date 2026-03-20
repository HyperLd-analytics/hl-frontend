"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/api";

type RequestConfig = RequestInit & {
  path: string;
};

type ApiError = Error;

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const request = useCallback(async <T,>({ path, ...config }: RequestConfig): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      return await apiFetch<T>({ path, ...config });
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        throw e;
      }
      const apiError = (e as ApiError) ?? new Error("网络错误，请稍后重试");
      setError(apiError);
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, []);

  return { request, loading, error };
}
