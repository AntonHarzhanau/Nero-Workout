"use client";
import { FormDialog } from "@/components/form-dialog";
import type { MuscleGroup } from "@/features/exercises/contracts";
import type { PlanSummary } from "@/features/plans/contracts";
import type { Workout } from "../contracts";
import { useWorkoutForm } from "../hooks/use-workout-form";
import { WorkoutForm } from "./workout-form";
export function WorkoutFormDialog({
  groups,
  plans,
  isAdmin,
  onSaved,
  onClose,
}: {
  groups: MuscleGroup[];
  plans: PlanSummary[];
  isAdmin: boolean;
  onSaved: (workout: Workout) => void;
  onClose: () => void;
}) {
  const form = useWorkoutForm({ onSaved });
  return (
    <FormDialog
      className="sm:max-w-2xl"
      title="Nouvelle séance"
      description="Enregistrez votre entraînement ou commencez à partir d’un plan."
      pending={form.formState.isSubmitting || form.template.pending}
      onClose={onClose}
    >
      <WorkoutForm
        form={form}
        groups={groups}
        plans={plans}
        isAdmin={isAdmin}
        onCancel={onClose}
      />
    </FormDialog>
  );
}
