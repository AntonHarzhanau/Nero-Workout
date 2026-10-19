import { Dumbbell, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import type { Exercise } from "../contracts";
import { ExerciseCard } from "./exercise-card";

type ExercisesGridProps = {
  exercises: Exercise[];
  userId: string;
  pending: boolean;
  onCreate: () => void;
  onResetFilters: () => void;
};

export function ExercisesGrid({
  exercises,
  userId,
  pending,
  onCreate,
  onResetFilters,
}: ExercisesGridProps) {
  if (!exercises.length) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="Aucun exercice trouvé"
        description="Modifiez vos filtres ou ajoutez un exercice personnel."
      >
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onResetFilters}
        >
          Réinitialiser les filtres
        </Button>
        <Button type="button" disabled={pending} onClick={onCreate}>
          <Plus aria-hidden="true" />
          Créer un exercice
        </Button>
      </EmptyState>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          isOwner={exercise.ownerId === userId}
        />
      ))}
    </div>
  );
}
