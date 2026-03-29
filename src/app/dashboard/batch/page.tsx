import { redirectToLocaleDashboard } from "@/lib/dashboard-locale-redirect";

export default async function BatchRedirectPage() {
  await redirectToLocaleDashboard("batch");
}
