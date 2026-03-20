"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useApi } from "@/hooks/use-api";

type UseApiQueryOptions = {
  enabled?: boolean;
  debounceMs?: number;
  staleTimeMs?: number;
  pollingIntervalMs?: number;
};

const cacheStore = new Map<string, { data: unknown; timestamp: number }>();

export function useApiQuery<T>(path: string, options: UseApiQueryOptions = {}) {
  const { enabled = true, debounceMs = 0, staleTimeMs = 0, pollingIntervalMs = 0 } = options;
  const { request, loading, error } = useApi();
  const [data, setData] = useState<T | null>(null);
  const lastRequestAtRef = useRef(0);
  const pollingTimerRef = useRef<number | null>(null);

  const refetch = useCallback(async (signal?: AbortSignal) => {
    if (!path) return null;
    lastRequestAtRef.current = Date.now();
    const result = await request<T>({ path, signal });
    setData(result);
    cacheStore.set(path, { data: result, timestamp: Date.now() });
    return result;
  }, [path, request]);

  useEffect(() => {
    if (!enabled || !path) return;
    const cached = cacheStore.get(path);
    if (cached && Date.now() - cached.timestamp <= staleTimeMs) {
      setData(cached.data as T);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      refetch(controller.signal).catch(() => undefined);
    }, debounceMs);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [debounceMs, enabled, path, refetch, staleTimeMs]);

  useEffect(() => {
    if (!enabled || !path || pollingIntervalMs <= 0) return;
    pollingTimerRef.current = window.setInterval(() => {
      if (Date.now() - lastRequestAtRef.current < pollingIntervalMs / 2) return;
      refetch().catch(() => undefined);
    }, pollingIntervalMs);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [enabled, path, pollingIntervalMs, refetch]);

  return { data, loading, error, refetch };
}
