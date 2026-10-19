"use client";
import type { ComponentProps } from "react";
import { RemoveTrainingExerciseButton } from "@/features/training/components/remove-training-exercise-button";
import { removePlanExerciseAction } from "../actions";

type Props = Omit<
  ComponentProps<typeof RemoveTrainingExerciseButton>,
  "action" | "containerLabel"
> & { planId: string };
export function RemovePlanExerciseButton({ planId, item, ...props }: Props) {
  return (
    <RemoveTrainingExerciseButton
      {...props}
      item={item}
      containerLabel="du plan"
      action={() => removePlanExerciseAction(planId, item.id)}
    />
  );
}
