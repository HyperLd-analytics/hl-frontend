import { redirectToNonLocaleDashboard } from "@/lib/dashboard-locale-redirect";

/** 订阅与账单仅实现于 `app/dashboard/billing` */
export default function BillingLocaleAliasPage() {
  redirectToNonLocaleDashboard("billing");
}
