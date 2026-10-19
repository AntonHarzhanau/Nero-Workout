"use client";

import { useId } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import type { ExerciseFormValues, MuscleGroup } from "../contracts";

export function MuscleGroupsField({ groups }: { groups: MuscleGroup[] }) {
  const id = useId();
  const {
    control,
    formState: { isSubmitting },
  } = useFormContext<ExerciseFormValues>();
  return (
    <Controller
      name="muscleGroups"
      control={control}
      render={({ field, fieldState }) => (
        <FieldSet
          className="gap-3"
          aria-describedby={`${id}-help${fieldState.error ? ` ${id}-error` : ""}`}
        >
          <FieldLegend className="mb-0 text-sm">
            Groupes musculaires
          </FieldLegend>
          <FieldDescription id={`${id}-help`} className="text-xs">
            Facultatif, 10 groupes maximum.
          </FieldDescription>
          <div className="grid gap-2 sm:grid-cols-2">
            {groups.map((group, index) => (
              <Field
                key={group.id}
                orientation="horizontal"
                className="rounded-md border bg-background p-3"
              >
                <Checkbox
                  disabled={isSubmitting}
                  id={`${id}-${group.id}`}
                  ref={index === 0 ? field.ref : undefined}
                  name={field.name}
                  checked={field.value.includes(group.id)}
                  onBlur={field.onBlur}
                  aria-invalid={fieldState.invalid}
                  onCheckedChange={(checked) =>
                    field.onChange(
                      checked
                        ? [...field.value, group.id]
                        : field.value.filter((value) => value !== group.id),
                    )
                  }
                />
                <FieldLabel
                  htmlFor={`${id}-${group.id}`}
                  className="cursor-pointer font-normal"
                >
                  {group.name}
                </FieldLabel>
              </Field>
            ))}
          </div>
          <FieldError id={`${id}-error`} errors={[fieldState.error]} />
        </FieldSet>
      )}
    />
  );
}
