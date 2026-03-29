import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/** 无 `[locale]` 段的 `/dashboard/...` 与仅存在于 `app/[locale]/dashboard/` 的页面对齐，按当前语言重定向 */
export async function redirectToLocaleDashboard(pathSegment: string): Promise<never> {
  const locale = await getLocale().catch(() => routing.defaultLocale);
  redirect(`/${locale}/dashboard/${pathSegment}`);
}

/** `/{locale}/dashboard/...` → 仅实现于 `app/dashboard/` 下的页面 */
export function redirectToNonLocaleDashboard(relativePath: string): never {
  const clean = relativePath.replace(/^\/+/, "");
  redirect(`/dashboard/${clean}`);
}
