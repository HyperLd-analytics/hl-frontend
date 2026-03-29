import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/** 无 `[locale]` 段的 `/dashboard/...` 访问仅存在于 `app/[locale]/dashboard/` 的页面时，按当前语言重定向（单向，避免与下方 re-export 混用造成循环） */
export async function redirectToLocaleDashboard(pathSegment: string): Promise<never> {
  const locale = await getLocale().catch(() => routing.defaultLocale);
  redirect(`/${locale}/dashboard/${pathSegment}`);
}
