"use client";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import { MAX_SETS, type TrainingFormValues } from "../contracts";
import { TrainingSetRow } from "./training-set-row";

export function TrainingSetsEditor({
  exerciseIndex,
  title,
}: {
  exerciseIndex: number;
  title: string;
}) {
  const {
    control,
    getValues,
    formState: { errors, isSubmitting },
  } = useFormContext<TrainingFormValues>();
  const name = `exercises.${exerciseIndex}.sets` as const;
  const { fields, append, remove } = useFieldArray({ control, name });
  return (
    <div className="space-y-2">
      <div
        className="grid grid-cols-[24px_minmax(0,1fr)_minmax(0,1fr)_32px] gap-2 text-[10px] text-muted-foreground"
        aria-hidden="true"
      >
        <span>Série</span>
        <span>Poids · kg</span>
        <span>Répétitions</span>
        <span />
      </div>
      {fields.map((set, index) => (
        <TrainingSetRow
          key={set.id}
          exerciseIndex={exerciseIndex}
          setIndex={index}
          title={title}
          onRemove={() => remove(index)}
        />
      ))}
      {!fields.length && (
        <p className="py-2 text-xs text-muted-foreground">
          Aucune série. Ajoutez-en une pour préparer ce mouvement.
        </p>
      )}
      <FieldError errors={[errors.exercises?.[exerciseIndex]?.sets?.root]} />
      <Button
        type="button"
        variant="link"
        size="sm"
        disabled={isSubmitting || fields.length >= MAX_SETS}
        onClick={() =>
          append({ ...(getValues(name).at(-1) ?? { weightKg: 0, reps: 10 }) })
        }
        className="px-0 text-xs"
      >
        <Plus aria-hidden="true" />
        Ajouter une série
      </Button>
    </div>
  );
}
