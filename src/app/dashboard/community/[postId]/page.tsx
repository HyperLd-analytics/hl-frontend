import { redirectToLocaleDashboard } from "@/lib/dashboard-locale-redirect";

export default async function CommunityPostRedirectPage({
  params,
}: {
  params: { postId: string };
}) {
  await redirectToLocaleDashboard(`community/${params.postId}`);
}
