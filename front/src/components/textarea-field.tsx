"use client";

import { useId, type ComponentProps } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

type TextareaFieldProps = ComponentProps<"textarea"> & {
  label: string;
  error?: string;
};

export function TextareaField({
  label,
  error,
  id,
  "aria-describedby": describedBy,
  ...props
}: TextareaFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  return (
    <Field data-invalid={Boolean(error)} className="gap-2">
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <Textarea
        {...props}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={
          [describedBy, error ? errorId : undefined]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  );
}
