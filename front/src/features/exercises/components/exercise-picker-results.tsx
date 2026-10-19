import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import type { ApiResult } from "@/lib/http/api-client";
import type { Exercise, ExercisesPage } from "../contracts";

type ExercisePickerResultsProps = {
  result: ApiResult<ExercisesPage> | null;
  loading: boolean;
  pending: boolean;
  excludeIds: string[];
  onSelect: (exercise: Exercise) => void;
};
export function ExercisePickerResults({
  result,
  loading,
  pending,
  excludeIds,
  onSelect,
}: ExercisePickerResultsProps) {
  return (
    <div
      aria-busy={loading || pending}
      className="max-h-72 min-h-24 overflow-y-auto"
    >
      {loading && (
        <p
          role="status"
          className="py-6 text-center text-sm text-muted-foreground"
        >
          Chargement des exercices…
        </p>
      )}
      {result && !result.ok && <FieldError>{result.error.message}</FieldError>}
      {result?.ok &&
        result.data.data.map((exercise) => {
          const selected = excludeIds.includes(exercise.id);
          return (
            <Button
              key={exercise.id}
              type="button"
              variant="ghost"
              disabled={pending || selected}
              onClick={() => onSelect(exercise)}
              className="h-auto w-full justify-between gap-3 rounded-none border-b px-2 py-3 text-left whitespace-normal"
            >
              <span className="min-w-0">
                <span className="block wrap-break-words">{exercise.title}</span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {exercise.muscleGroups
                    .map((group) => group.name)
                    .join(" · ") ||
                    exercise.equipment ||
                    "Sans groupe musculaire"}
                  {selected && " · Déjà ajouté"}
                </span>
              </span>
              <Plus aria-hidden="true" className="shrink-0" />
            </Button>
          );
        })}
      {result?.ok && !result.data.data.length && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Aucun exercice trouvé.
        </p>
      )}
    </div>
  );
}
