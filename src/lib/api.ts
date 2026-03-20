import { clearAccessTokenCookie, setAccessTokenCookie } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type ApiFetchOptions = RequestInit & {
  path: string;
  retryOnAuthError?: boolean;
};

async function tryRefreshToken() {
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
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

export async function apiFetch<T>({ path, retryOnAuthError = true, ...config }: ApiFetchOptions): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...config,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(config.headers ?? {})
    }
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

  if (!response.ok) {
    let message = "请求失败";
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) message = payload.message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
