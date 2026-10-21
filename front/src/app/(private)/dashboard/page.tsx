import { loadStatistics } from "@/features/statistics/load-statistics";
import { StatisticsDashboard } from "@/features/statistics/components/statistics-pages";

export default async function Page({ searchParams }: PageProps<"/dashboard">) {
  const data = await loadStatistics("/dashboard", await searchParams);
  return <StatisticsDashboard data={data} />;
}
