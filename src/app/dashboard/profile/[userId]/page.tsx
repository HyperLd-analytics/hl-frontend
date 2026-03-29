import { redirectToLocaleDashboard } from "@/lib/dashboard-locale-redirect";

export default async function ProfileRedirectPage({
  params,
}: {
  params: { userId: string };
}) {
  await redirectToLocaleDashboard(`profile/${params.userId}`);
}
