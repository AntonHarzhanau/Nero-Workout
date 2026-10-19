import { Skeleton } from "@/components/ui/skeleton";

export default function ExerciseLoading() {
  return (
    <div
      role="status"
      aria-label="Chargement de l’exercice"
      className="mx-auto max-w-3xl space-y-7"
    >
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-64 max-w-full" />
      <Skeleton className="h-80 w-full rounded-xl" />
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
