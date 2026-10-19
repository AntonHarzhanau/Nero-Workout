import { Skeleton } from "@/components/ui/skeleton";

export default function ExercisesLoading() {
  return (
    <div role="status" aria-label="Chargement des exercices">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="mt-3 h-4 w-64 max-w-full" />

      <div className="mt-8 flex flex-wrap gap-3">
        <Skeleton className="h-10 w-full sm:w-80" />
        <Skeleton className="h-10 w-60" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-56 rounded-xl" />
        ))}
      </div>

      <span className="sr-only">Chargement…</span>
    </div>
  );
}
