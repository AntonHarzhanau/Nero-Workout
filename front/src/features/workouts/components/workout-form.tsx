"use client";
import { FormProvider } from "react-hook-form";
import { FormActions } from "@/components/form-actions";
import { TextareaField } from "@/components/textarea-field";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { TrainingExercisesEditor } from "@/features/training/components/training-exercises-editor";
import type { MuscleGroup } from "@/features/exercises/contracts";
import type { PlanSummary } from "@/features/plans/contracts";
import { MAX_WORKOUT_EXERCISES, MAX_WORKOUT_SETS } from "../contracts";
import type { useWorkoutForm } from "../hooks/use-workout-form";
import { WorkoutFormFields } from "./workout-form-fields";
import { WorkoutPlanPicker } from "./workout-plan-picker";

type WorkoutFormProps = {
  form: ReturnType<typeof useWorkoutForm>;
  groups: MuscleGroup[];
  isAdmin: boolean;
  plans?: PlanSummary[];
  editing?: boolean;
  onCancel: () => void;
};
export function WorkoutForm({
  form,
  groups,
  isAdmin,
  plans = [],
  editing = false,
  onCancel,
}: WorkoutFormProps) {
  const {
    register,
    formState: { errors, isSubmitting },
    template,
  } = form;
  const pending = isSubmitting || template.pending;
  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => {
          event.stopPropagation();
          void form.onSubmit(event);
        }}
        noValidate
        aria-busy={pending}
      >
        <fieldset disabled={pending} className="space-y-6">
          <FieldGroup className="gap-5">
            {!editing && plans.length > 0 && (
              <WorkoutPlanPicker plans={plans} template={template} />
            )}
            <WorkoutFormFields />
            <TrainingExercisesEditor
              groups={groups}
              isAdmin={isAdmin}
              maxExercises={MAX_WORKOUT_EXERCISES}
              maxSets={MAX_WORKOUT_SETS}
            />
            <TextareaField
              label="Notes (facultatif)"
              placeholder="Sensations, temps de repos…"
              maxLength={10000}
              rows={4}
              error={errors.description?.message}
              {...register("description")}
            />
          </FieldGroup>
          <FieldError errors={[errors.root, errors.exercises]} />
          <FormActions
            pending={pending}
            submitLabel={
              editing
                ? "Enregistrer les modifications"
                : "Enregistrer la séance"
            }
            cancelLabel={editing ? "Annuler les modifications" : "Annuler"}
            onCancel={onCancel}
          />
        </fieldset>
      </form>
    </FormProvider>
  );
}
