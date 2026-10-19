"use client";
import { FormDialog } from "@/components/form-dialog";
import type { MuscleGroup } from "@/features/exercises/contracts";
import type { Plan } from "../contracts";
import { usePlanForm } from "../hooks/use-plan-form";
import { PlanForm } from "./plan-form";
export function PlanFormDialog({
  groups,
  isAdmin,
  onSaved,
  onClose,
}: {
  groups: MuscleGroup[];
  isAdmin: boolean;
  onSaved: (plan: Plan) => void;
  onClose: () => void;
}) {
  const form = usePlanForm({ onSaved });
  return (
    <FormDialog
      className="sm:max-w-2xl"
      title="Créer un plan"
      description="Préparez les exercices, les séries et les poids de votre prochaine séance."
      pending={form.formState.isSubmitting}
      onClose={onClose}
    >
      <PlanForm
        form={form}
        groups={groups}
        isAdmin={isAdmin}
        onCancel={onClose}
      />
    </FormDialog>
  );
}
