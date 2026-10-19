"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Exercise, MuscleGroup } from "../contracts";
import { useExerciseForm } from "../hooks/use-exercise-form";
import { ExerciseForm } from "./exercise-form";

type ExerciseEditFormProps = {
  exercise: Exercise;
  groups: MuscleGroup[];
  isAdmin: boolean;
  onCancel: () => void;
  onSaved: (exercise: Exercise) => void;
};

export function ExerciseEditForm({
  exercise,
  groups,
  isAdmin,
  onCancel,
  onSaved,
}: ExerciseEditFormProps) {
  const form = useExerciseForm({ exercise, onSaved });
  return (
    <Card>
      <CardContent>
        <ExerciseForm
          form={form}
          groups={groups}
          isAdmin={isAdmin}
          submitLabel="Enregistrer les modifications"
          cancelLabel="Annuler les modifications"
          onCancel={onCancel}
        />
      </CardContent>
    </Card>
  );
}
