import { redirectToNonLocaleDashboard } from "@/lib/dashboard-locale-redirect";

export default function CohortTypeLocaleAliasPage({
  params,
}: {
  params: { cohortType: string };
}) {
  redirectToNonLocaleDashboard(`cohorts/${params.cohortType}`);
}
