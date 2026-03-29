import { redirectToLocaleDashboard } from "@/lib/dashboard-locale-redirect";

export default async function CommunityRedirectPage() {
  await redirectToLocaleDashboard("community");
}
