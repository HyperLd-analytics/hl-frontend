import { AUTH_COOKIE_NAME, clearAccessTokenCookie, setAccessTokenCookie } from "@/lib/auth";
import { emitToast } from "@/lib/toast-store";

const API_BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_URL ?? "");
const API_PREFIX = "/api/v1";

type ApiFetchOptions = RequestInit & {
  path: string;
  retryOnAuthError?: boolean;
};

function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === AUTH_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

async function tryRefreshToken() {
  const res = await fetch(`${API_BASE_URL}${API_PREFIX}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!res.ok) return false;

  const data = (await res.json()) as { accessToken?: string };
  if (data.accessToken) {
    setAccessTokenCookie(data.accessToken);
  }
  return true;
}

export async function apiFetch<T>({ path, retryOnAuthError = true, signal, ...config }: ApiFetchOptions & { signal?: AbortSignal | null }): Promise<T> {
  const token = getAccessTokenFromCookie();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.headers as Record<string, string> ?? {})
  };

  // 如果有 token，添加到 Authorization header
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
    ...config,
    credentials: "include",
    cache: "no-store",
    headers,
    // 显式传递 signal，避免浏览器将 undefined signal 当作无效值
    ...(signal instanceof AbortSignal ? { signal } : {}),
  });

  if (response.status === 401 && retryOnAuthError) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiFetch<T>({ path, ...config, retryOnAuthError: false });
    }
    clearAccessTokenCookie();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("登录已过期，请重新登录");
  }

  if (response.status === 403) {
    throw new Error("无权限访问该资源");
  }

  if (response.status === 429) {
    const clonedResponse = response.clone();
    const text = await clonedResponse.text();
    let message = "请求过于频繁，请稍后再试";
    try {
      const payload = JSON.parse(text) as { error?: string; detail?: string };
      if (payload.error) message = payload.error;
      else if (payload.detail) message = payload.detail;
    } catch {
      message = text || message;
    }
    // Show toast notification for rate limit errors
    if (typeof window !== "undefined") {
      emitToast(message, "error");
    }
    throw new Error(message);
  }

  if (!response.ok) {
    let message = "请求失败";
    try {
      // Clone response to avoid body stream issues
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();
      if (text) {
        try {
          const payload = JSON.parse(text) as { message?: string };
          if (payload.message) message = payload.message;
        } catch {
          message = text;
        }
      }
    } catch {
      // Ignore
    }
    throw new Error(message);
  }

  // Clone response before reading to avoid body stream issues
  const clonedResponse = response.clone();
  return (await clonedResponse.json()) as T;
}
