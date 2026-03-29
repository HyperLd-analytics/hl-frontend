import { redirectToNonLocaleDashboard } from "@/lib/dashboard-locale-redirect";

/** Hypertracker 仅实现于 `app/dashboard/hypertracker` */
export default function HypertrackerLocaleAliasPage() {
  redirectToNonLocaleDashboard("hypertracker");
}
