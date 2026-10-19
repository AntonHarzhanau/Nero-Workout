"use client";
import type { ComponentProps } from "react";
import { RemoveTrainingExerciseButton } from "@/features/training/components/remove-training-exercise-button";
import { removeWorkoutExerciseAction } from "../actions";

type Props = Omit<
  ComponentProps<typeof RemoveTrainingExerciseButton>,
  "action" | "containerLabel"
> & { workoutId: string };
export function RemoveWorkoutExerciseButton({
  workoutId,
  item,
  ...props
}: Props) {
  return (
    <RemoveTrainingExerciseButton
      {...props}
      item={item}
      containerLabel="de la séance"
      action={() => removeWorkoutExerciseAction(workoutId, item.id)}
    />
  );
}
