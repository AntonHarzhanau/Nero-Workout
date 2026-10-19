"use client";
import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { ExercisePicker } from "@/features/exercises/components/exercise-picker";
import type { MuscleGroup } from "@/features/exercises/contracts";
import { defaultTrainingSets, type TrainingFormValues } from "../contracts";
import { TrainingExerciseEditor } from "./training-exercise-editor";

type TrainingExercisesEditorProps = {
  groups: MuscleGroup[];
  isAdmin: boolean;
  maxExercises: number;
};
export function TrainingExercisesEditor({
  groups,
  isAdmin,
  maxExercises,
}: TrainingExercisesEditorProps) {
  const [picking, setPicking] = useState(false);
  const {
    control,
    formState: { errors, isSubmitting },
  } = useFormContext<TrainingFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "exercises",
  });
  return (
    <section aria-label="Exercices de l’entraînement" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Exercices</h2>
        <span className="text-xs text-muted-foreground">
          {fields.length} / {maxExercises}
        </span>
      </div>
      {fields.map((entry, index) => (
        <TrainingExerciseEditor
          key={`${entry.id}-${index}`}
          entry={entry}
          index={index}
          count={fields.length}
          onMove={move}
          onRemove={() => remove(index)}
        />
      ))}
      {!fields.length && (
        <p className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
          Ajoutez les mouvements que vous souhaitez préparer.
        </p>
      )}
      <FieldError errors={[errors.exercises?.root]} />
      <Button
        type="button"
        variant="outline"
        disabled={isSubmitting || fields.length >= maxExercises}
        onClick={() => setPicking(true)}
        className="w-full border-dashed"
      >
        <Plus aria-hidden="true" />
        Ajouter un exercice
      </Button>
      {picking && (
        <ExercisePicker
          groups={groups}
          isAdmin={isAdmin}
          excludeIds={fields.map((entry) => entry.exerciseId)}
          onClose={() => setPicking(false)}
          onSelect={(exercise) => {
            append({
              exerciseId: exercise.id,
              title: exercise.title,
              sets: defaultTrainingSets(),
            });
            setPicking(false);
          }}
        />
      )}
    </section>
  );
}
