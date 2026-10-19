"use client";

import { Button } from "@/components/ui/button";

export default function ExercisesError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div role="alert" className="rounded-xl border bg-card p-8">
      <h1 className="font-heading text-3xl">
        Impossible de charger les exercices
      </h1>

      <p className="mt-3 text-sm text-muted-foreground">
        Le service est peut-être temporairement indisponible. Réessayez dans
        quelques instants.
      </p>

      <Button type="button" className="mt-5" onClick={() => retry()}>
        Réessayer
      </Button>
    </div>
  );
}
