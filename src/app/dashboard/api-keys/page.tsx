import { redirectToLocaleDashboard } from "@/lib/dashboard-locale-redirect";

export default async function ApiKeysRedirectPage() {
  await redirectToLocaleDashboard("api-keys");
}
