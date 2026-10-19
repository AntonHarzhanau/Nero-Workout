"use client";
import { useFormContext } from "react-hook-form";
import { InputField } from "@/components/input-field";
import type { WorkoutFormValues } from "../contracts";

export function WorkoutFormFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<WorkoutFormValues>();
  return (
    <>
      <InputField
        label="Nom de la séance"
        placeholder="Ex. Haut du corps"
        required
        maxLength={120}
        error={errors.title?.message}
        {...register("title")}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Date"
          type="date"
          required
          error={errors.workoutDate?.message}
          {...register("workoutDate")}
        />
        <InputField
          label="Durée · min (facultatif)"
          type="number"
          inputMode="numeric"
          min={0}
          max={5000}
          step={1}
          placeholder="Non renseignée"
          error={errors.durationMinutes?.message}
          {...register("durationMinutes", {
            setValueAs: (value: string | number | null) =>
              value === "" || value === null ? null : Number(value),
          })}
        />
      </div>
    </>
  );
}
