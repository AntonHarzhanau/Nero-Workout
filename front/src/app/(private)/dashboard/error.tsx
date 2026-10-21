"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export default function StatisticsError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Card role="alert">
      <CardContent className="items-start gap-4">
        <h1 className="font-heading text-3xl">
          Impossible de charger les statistiques
        </h1>
        <p className="text-sm text-muted-foreground">
          Le service est temporairement indisponible. Réessayez dans quelques
          instants.
        </p>
        <Button onClick={retry}>Réessayer</Button>
      </CardContent>
    </Card>
  );
}
