import { Skeleton } from "@/components/ui/skeleton";
export default function StatisticsLoading() {
  return (
    <div
      role="status"
      aria-label="Chargement des statistiques"
      className="space-y-7"
    >
      <Skeleton className="h-10 w-64 max-w-full" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-36" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
