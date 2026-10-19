import { Skeleton } from "@/components/ui/skeleton";
export default function WorkoutLoading() {
  return (
    <div
      role="status"
      aria-label="Chargement de la séance"
      className="mx-auto max-w-3xl space-y-7"
    >
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-64 max-w-full" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-72 rounded-xl" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
