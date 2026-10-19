"use client";
import type { MuscleGroup } from "@/features/exercises/contracts";
import { ExercisePicker } from "@/features/exercises/components/exercise-picker";
import {
  defaultTrainingSets,
  type TrainingExercise,
} from "@/features/training/contracts";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { addPlanExerciseAction } from "../actions";
export function AddPlanExerciseDialog({
  planId,
  exerciseIds,
  groups,
  isAdmin,
  onClose,
  onAdded,
}: {
  planId: string;
  exerciseIds: string[];
  groups: MuscleGroup[];
  isAdmin: boolean;
  onClose: () => void;
  onAdded: () => void;
}) {
  const mutation = useApiMutation<TrainingExercise>(onAdded);
  return (
    <ExercisePicker
      groups={groups}
      isAdmin={isAdmin}
      excludeIds={exerciseIds}
      pending={mutation.pending}
      error={mutation.error}
      onClose={onClose}
      onSelect={(exercise) =>
        mutation.run(() =>
          addPlanExerciseAction(planId, {
            exerciseId: exercise.id,
            sets: defaultTrainingSets(),
          }),
        )
      }
    />
  );
}
