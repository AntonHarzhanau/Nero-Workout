"use client";
import { useFormContext } from "react-hook-form";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { TrainingFormValues } from "../contracts";

type TrainingSetRowProps = {
  exerciseIndex: number;
  setIndex: number;
  title: string;
  onRemove: () => void;
};
export function TrainingSetRow({
  exerciseIndex,
  setIndex,
  title,
  onRemove,
}: TrainingSetRowProps) {
  const {
    register,
    formState: { errors, isSubmitting },
  } = useFormContext<TrainingFormValues>();
  const name = `exercises.${exerciseIndex}.sets.${setIndex}` as const;
  const errorsForSet = errors.exercises?.[exerciseIndex]?.sets?.[setIndex];
  const id = `exercise-${exerciseIndex}-set-${setIndex}`;
  return (
    <div className="grid grid-cols-[24px_minmax(0,1fr)_minmax(0,1fr)_32px] items-start gap-2">
      <span className="pt-2 text-center text-xs text-muted-foreground">
        {setIndex + 1}
      </span>
      <Field data-invalid={Boolean(errorsForSet?.weightKg)} className="gap-1">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          max={9999.99}
          step="0.01"
          aria-label={`Poids série ${setIndex + 1} ${title}`}
          aria-invalid={Boolean(errorsForSet?.weightKg)}
          aria-describedby={
            errorsForSet?.weightKg ? `${id}-weight-error` : undefined
          }
          {...register(`${name}.weightKg`, { valueAsNumber: true })}
        />
        <FieldError
          id={`${id}-weight-error`}
          errors={[errorsForSet?.weightKg]}
        />
      </Field>
      <Field data-invalid={Boolean(errorsForSet?.reps)} className="gap-1">
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          max={32767}
          step={1}
          aria-label={`Répétitions série ${setIndex + 1} ${title}`}
          aria-invalid={Boolean(errorsForSet?.reps)}
          aria-describedby={errorsForSet?.reps ? `${id}-reps-error` : undefined}
          {...register(`${name}.reps`, { valueAsNumber: true })}
        />
        <FieldError id={`${id}-reps-error`} errors={[errorsForSet?.reps]} />
      </Field>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        disabled={isSubmitting}
        aria-label={`Retirer la série ${setIndex + 1} ${title}`}
        onClick={onRemove}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </div>
  );
}
