import { redirectToLocaleDashboard } from "@/lib/dashboard-locale-redirect";

export default async function PositionHeatmapRedirectPage() {
  await redirectToLocaleDashboard("position-heatmap");
}
