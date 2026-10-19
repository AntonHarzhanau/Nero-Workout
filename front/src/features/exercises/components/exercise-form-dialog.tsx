"use client";

import { FormDialog } from "@/components/form-dialog";
import type { Exercise, MuscleGroup } from "../contracts";
import { useExerciseForm } from "../hooks/use-exercise-form";
import { ExerciseForm } from "./exercise-form";

type ExerciseFormDialogProps = {
  groups: MuscleGroup[];
  isAdmin: boolean;
  onClose: () => void;
  onSaved: (exercise: Exercise) => void;
};

export function ExerciseFormDialog({
  groups,
  isAdmin,
  onClose,
  onSaved,
}: ExerciseFormDialogProps) {
  const form = useExerciseForm({ onSaved });
  return (
    <FormDialog
      title="Créer un exercice"
      description="Décrivez le mouvement et choisissez les muscles travaillés."
      pending={form.formState.isSubmitting}
      onClose={onClose}
    >
      <ExerciseForm
        form={form}
        groups={groups}
        isAdmin={isAdmin}
        submitLabel="Créer l’exercice"
        onCancel={onClose}
      />
    </FormDialog>
  );
}
