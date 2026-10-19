"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionForm } from "@/hooks/use-action-form";
import { toTrainingDraft, toTrainingPayload } from "@/features/training/drafts";
import { saveWorkoutAction } from "../actions";
import {
  workoutFormSchema,
  type Workout,
  type WorkoutFormValues,
} from "../contracts";
import { todayDate } from "../formatters";
import { usePlanTemplate } from "./use-plan-template";

export function useWorkoutForm({
  workout,
  onSaved,
}: {
  workout?: Workout;
  onSaved: (workout: Workout) => void;
}) {
  const form = useActionForm<WorkoutFormValues>({
    fields: [
      "title",
      "workoutDate",
      "durationMinutes",
      "description",
      "exercises",
    ],
    action: async (values) => {
      const result = await saveWorkoutAction(workout?.id ?? null, {
        ...values,
        description: values.description.trim() || null,
        exercises: toTrainingPayload(values.exercises),
      });
      if (!result.ok) return result.error;
      onSaved(result.data);
    },
    formOptions: {
      resolver: zodResolver(workoutFormSchema),
      defaultValues: {
        title: workout?.title ?? "",
        workoutDate: workout?.workoutDate ?? todayDate(),
        durationMinutes: workout?.durationMinutes ?? null,
        description: workout?.description ?? "",
        exercises: toTrainingDraft(workout?.exercises ?? []),
      },
    },
  });
  const template = usePlanTemplate((plan) => {
    form.setValue("title", plan.title, { shouldDirty: true });
    form.setValue("description", plan.description ?? "", { shouldDirty: true });
    form.setValue("exercises", toTrainingDraft(plan.exercises), {
      shouldDirty: true,
    });
    form.clearErrors();
  });
  return { ...form, template };
}
