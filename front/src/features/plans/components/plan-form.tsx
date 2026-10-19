"use client";
import { FormProvider } from "react-hook-form";
import { FormActions } from "@/components/form-actions";
import { InputField } from "@/components/input-field";
import { TextareaField } from "@/components/textarea-field";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { TrainingExercisesEditor } from "@/features/training/components/training-exercises-editor";
import type { MuscleGroup } from "@/features/exercises/contracts";
import { MAX_PLAN_EXERCISES } from "../contracts";
import type { usePlanForm } from "../hooks/use-plan-form";

type PlanFormProps = {
  form: ReturnType<typeof usePlanForm>;
  groups: MuscleGroup[];
  isAdmin: boolean;
  editing?: boolean;
  onCancel: () => void;
};
export function PlanForm({
  form,
  groups,
  isAdmin,
  editing = false,
  onCancel,
}: PlanFormProps) {
  const {
    register,
    formState: { errors, isSubmitting },
  } = form;
  return (
    <FormProvider {...form}>
      <form
        onSubmit={(event) => {
          event.stopPropagation();
          void form.onSubmit(event);
        }}
        noValidate
        aria-busy={isSubmitting}
      >
        <fieldset disabled={isSubmitting} className="space-y-6">
          <FieldGroup className="gap-5">
            <InputField
              label="Nom du plan"
              placeholder="Ex. Haut du corps"
              required
              maxLength={120}
              error={errors.title?.message}
              {...register("title")}
            />
            <TrainingExercisesEditor
              groups={groups}
              isAdmin={isAdmin}
              maxExercises={MAX_PLAN_EXERCISES}
            />
            <TextareaField
              label="Notes (facultatif)"
              placeholder="Objectifs, temps de repos…"
              maxLength={10000}
              rows={4}
              error={errors.description?.message}
              {...register("description")}
            />
          </FieldGroup>
          <FieldError errors={[errors.root, errors.exercises]} />
          <FormActions
            pending={isSubmitting}
            submitLabel={
              editing ? "Enregistrer les modifications" : "Créer le plan"
            }
            cancelLabel={editing ? "Annuler les modifications" : "Annuler"}
            onCancel={onCancel}
          />
        </fieldset>
      </form>
    </FormProvider>
  );
}
