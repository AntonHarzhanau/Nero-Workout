"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export default function PlansError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Card role="alert">
      <CardContent className="items-start gap-4">
        <h1 className="font-heading text-3xl">
          Impossible de charger les plans
        </h1>
        <p className="text-sm text-muted-foreground">
          Le service est peut-être temporairement indisponible. Réessayez dans
          quelques instants.
        </p>
        <Button type="button" onClick={retry}>
          Réessayer
        </Button>
      </CardContent>
    </Card>
  );
}
