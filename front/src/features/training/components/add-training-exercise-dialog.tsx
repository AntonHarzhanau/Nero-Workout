"use client";
import type { MuscleGroup } from "@/features/exercises/contracts";
import { ExercisePicker } from "@/features/exercises/components/exercise-picker";
import {
  defaultTrainingSets,
  type TrainingExercise,
} from "@/features/training/contracts";
import { useApiMutation } from "@/hooks/use-api-mutation";
import type { ApiResult } from "@/lib/http/api-client";
import type { TrainingExerciseDraft } from "../contracts";
export function AddTrainingExerciseDialog({
  action,
  exerciseIds,
  groups,
  isAdmin,
  onClose,
  onAdded,
}: {
  action: (
    input: Omit<TrainingExerciseDraft, "title">,
  ) => Promise<ApiResult<TrainingExercise>>;
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
          action({
            exerciseId: exercise.id,
            sets: defaultTrainingSets(),
          }),
        )
      }
    />
  );
}
