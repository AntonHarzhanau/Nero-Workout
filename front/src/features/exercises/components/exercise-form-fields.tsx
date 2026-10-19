"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";
import { InputField } from "@/components/input-field";
import { TextareaField } from "@/components/textarea-field";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import type { ExerciseFormValues, MuscleGroup } from "../contracts";
import { MuscleGroupsField } from "./muscle-groups-field";

export function ExerciseFormFields({
  groups,
  isAdmin,
}: {
  groups: MuscleGroup[];
  isAdmin: boolean;
}) {
  const id = useId();
  const {
    register,
    getValues,
    formState: { errors },
  } = useFormContext<ExerciseFormValues>();
  return (
    <>
      <InputField
        label="Nom de l’exercice"
        placeholder="Ex. Rowing à un bras"
        required
        maxLength={120}
        error={errors.title?.message}
        {...register("title")}
      />
      <InputField
        label="Matériel"
        placeholder="Ex. Haltères, barre, poids du corps"
        maxLength={120}
        error={errors.equipment?.message}
        {...register("equipment")}
      />
      <MuscleGroupsField groups={groups} />
      <TextareaField
        label="Description (facultatif)"
        rows={5}
        maxLength={2000}
        error={errors.description?.message}
        {...register("description")}
      />
      {isAdmin ? (
        <Field data-invalid={Boolean(errors.visibility)} className="gap-2">
          <FieldLabel htmlFor={id}>Visibilité</FieldLabel>
          <NativeSelect
            id={id}
            className="w-full"
            aria-invalid={Boolean(errors.visibility)}
            aria-describedby={errors.visibility ? `${id}-error` : undefined}
            {...register("visibility")}
          >
            <NativeSelectOption value="private">Personnel</NativeSelectOption>
            <NativeSelectOption value="public">
              Catalogue public
            </NativeSelectOption>
          </NativeSelect>
          <FieldError id={`${id}-error`} errors={[errors.visibility]} />
        </Field>
      ) : (
        <>
          <input type="hidden" {...register("visibility")} />
          <p className="text-xs text-muted-foreground">
            {getValues("visibility") === "public"
              ? "Cet exercice appartient au catalogue public."
              : "Cet exercice est visible uniquement dans votre espace."}
          </p>
        </>
      )}
    </>
  );
}
