"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionForm } from "@/hooks/use-action-form";
import { saveExerciseAction } from "../actions";
import {
  exerciseFormSchema,
  type Exercise,
  type ExerciseFormValues,
} from "../contracts";

type UseExerciseFormOptions = {
  exercise?: Exercise;
  onSaved: (exercise: Exercise) => void;
};

export function useExerciseForm({ exercise, onSaved }: UseExerciseFormOptions) {
  return useActionForm<ExerciseFormValues>({
    fields: ["title", "description", "equipment", "visibility", "muscleGroups"],
    action: async (values) => {
      const result = await saveExerciseAction(exercise?.id ?? null, values);
      if (!result.ok) return result.error;
      onSaved(result.data);
    },
    formOptions: {
      resolver: zodResolver(exerciseFormSchema),
      defaultValues: {
        title: exercise?.title ?? "",
        description: exercise?.description ?? "",
        equipment: exercise?.equipment ?? "",
        visibility: exercise?.visibility ?? "private",
        muscleGroups: exercise?.muscleGroups.map((group) => group.id) ?? [],
      },
    },
  });
}
