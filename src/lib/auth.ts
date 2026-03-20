export const AUTH_COOKIE_NAME = "hl_access_token";

export function setAccessTokenCookie(token: string) {
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=86400; samesite=lax`;
}

export function clearAccessTokenCookie() {
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}
