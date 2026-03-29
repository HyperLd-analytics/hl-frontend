import { redirect } from "next/navigation";

/** 订阅与账单仅实现于 `app/dashboard/billing`，统一回到无 locale 前缀路由 */
export default function BillingLocaleAliasPage() {
  redirect("/dashboard/billing");
}
