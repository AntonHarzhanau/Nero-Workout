import { Skeleton } from "@/components/ui/skeleton";
export default function WorkoutsLoading() {
  return (
    <div
      role="status"
      aria-label="Chargement des séances"
      className="space-y-7"
    >
      <Skeleton className="h-10 w-64 max-w-full" />
      <Skeleton className="h-10 w-full sm:w-80" />
      <div className="space-y-0 overflow-hidden rounded-xl border">
        <Skeleton className="m-5 h-7 w-32" />
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-t p-5">
            <Skeleton className="h-12 w-11 shrink-0" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="ml-auto h-8 w-14 shrink-0" />
          </div>
        ))}
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}
