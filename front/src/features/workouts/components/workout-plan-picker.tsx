"use client";
import { useId } from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import type { PlanSummary } from "@/features/plans/contracts";
import type { usePlanTemplate } from "../hooks/use-plan-template";

export function WorkoutPlanPicker({
  plans,
  template,
}: {
  plans: PlanSummary[];
  template: ReturnType<typeof usePlanTemplate>;
}) {
  const id = useId();
  return (
    <Field
      className="gap-2"
      data-invalid={Boolean(template.error)}
      aria-busy={template.pending}
    >
      <FieldLabel htmlFor={id}>À partir d’un plan</FieldLabel>
      <NativeSelect
        id={id}
        className="w-full"
        value={template.selectedId}
        disabled={template.pending}
        onChange={(event) => void template.select(event.target.value)}
        aria-describedby={`${id}-description${template.error ? ` ${id}-error` : ""}`}
        aria-invalid={Boolean(template.error)}
      >
        <option value="">Créer manuellement</option>
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.title}
          </option>
        ))}
      </NativeSelect>
      <FieldDescription id={`${id}-description`}>
        {template.pending
          ? "Chargement du plan…"
          : "Le choix d’un plan remplace le nom, les notes et les exercices du brouillon. La date et la durée sont conservées."}
      </FieldDescription>
      {template.error && (
        <FieldError id={`${id}-error`}>{template.error}</FieldError>
      )}
    </Field>
  );
}
