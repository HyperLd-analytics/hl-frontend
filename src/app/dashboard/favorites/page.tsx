import { redirectToLocaleDashboard } from "@/lib/dashboard-locale-redirect";

export default async function FavoritesRedirectPage() {
  await redirectToLocaleDashboard("favorites");
}
