import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function ExerciseNotFound() {
  return (
    <EmptyState
      icon={Dumbbell}
      title="Exercice introuvable"
      description="Cet exercice n’existe plus ou n’est pas accessible avec votre compte."
    >
      <Button nativeButton={false} render={<Link href="/exercises" />}>
        Tous les exercices
      </Button>
    </EmptyState>
  );
}
