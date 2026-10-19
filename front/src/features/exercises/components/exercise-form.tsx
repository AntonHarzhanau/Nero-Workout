"use client";

import { FormProvider } from "react-hook-form";
import { FormActions } from "@/components/form-actions";
import { FieldError, FieldGroup } from "@/components/ui/field";
import type { MuscleGroup } from "../contracts";
import type { useExerciseForm } from "../hooks/use-exercise-form";
import { ExerciseFormFields } from "./exercise-form-fields";

type ExerciseFormProps = {
  form: ReturnType<typeof useExerciseForm>;
  groups: MuscleGroup[];
  isAdmin: boolean;
  submitLabel: string;
  cancelLabel?: string;
  onCancel: () => void;
};

export function ExerciseForm({
  form,
  groups,
  isAdmin,
  submitLabel,
  cancelLabel,
  onCancel,
}: ExerciseFormProps) {
  const { isSubmitting, errors } = form.formState;
  return (
    <FormProvider {...form}>
      <form onSubmit={form.onSubmit} noValidate aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="space-y-6">
          <FieldGroup className="gap-5">
            <ExerciseFormFields groups={groups} isAdmin={isAdmin} />
          </FieldGroup>
          <FieldError errors={[errors.root]} />
          <FormActions
            pending={isSubmitting}
            submitLabel={submitLabel}
            cancelLabel={cancelLabel}
            onCancel={onCancel}
          />
        </fieldset>
      </form>
    </FormProvider>
  );
}
