import { Skeleton } from "@/components/ui/skeleton";
export default function PlansLoading() {
  return (
    <div role="status" aria-label="Chargement des plans" className="space-y-7">
      <Skeleton className="h-10 w-64 max-w-full" />
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-56 rounded-xl" />
        ))}
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
