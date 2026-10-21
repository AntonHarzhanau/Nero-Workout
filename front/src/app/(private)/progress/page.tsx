import { loadStatistics } from "@/features/statistics/load-statistics";
import { StatisticsProgress } from "@/features/statistics/components/statistics-pages";

export default async function Page({ searchParams }: PageProps<"/progress">) {
  const data = await loadStatistics("/progress", await searchParams);
  return <StatisticsProgress data={data} />;
}
