"use client";
import type { ComponentProps } from "react";
import { AddTrainingExerciseDialog } from "@/features/training/components/add-training-exercise-dialog";
import { addPlanExerciseAction } from "../actions";

type Props = Omit<
  ComponentProps<typeof AddTrainingExerciseDialog>,
  "action"
> & { planId: string };
export function AddPlanExerciseDialog({ planId, ...props }: Props) {
  return (
    <AddTrainingExerciseDialog
      {...props}
      action={(input) => addPlanExerciseAction(planId, input)}
    />
  );
}
