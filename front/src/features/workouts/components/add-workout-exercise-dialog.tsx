"use client";
import type { ComponentProps } from "react";
import { AddTrainingExerciseDialog } from "@/features/training/components/add-training-exercise-dialog";
import { addWorkoutExerciseAction } from "../actions";

type Props = Omit<
  ComponentProps<typeof AddTrainingExerciseDialog>,
  "action"
> & { workoutId: string };
export function AddWorkoutExerciseDialog({ workoutId, ...props }: Props) {
  return (
    <AddTrainingExerciseDialog
      {...props}
      action={(input) => addWorkoutExerciseAction(workoutId, input)}
    />
  );
}
