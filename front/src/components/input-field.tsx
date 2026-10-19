"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

type InputFieldProps = ComponentProps<"input"> & {
  name: string;
  label: string;
  error?: string;
};

export function InputField({
  label,
  error,
  id,
  name,
  type = "text",
  disabled,
  className,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...inputProps
}: InputFieldProps) {
  const generatedId = useId();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const isPassword = type === "password";

  const inputType = isPassword && isPasswordVisible ? "text" : type;

  const VisibilityIcon = isPasswordVisible ? EyeOff : Eye;

  const describedBy =
    [ariaDescribedBy, error ? errorId : undefined].filter(Boolean).join(" ") ||
    undefined;

  return (
    <Field data-invalid={Boolean(error)} className="gap-2">
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>

      <div className="relative">
        <Input
          {...inputProps}
          id={inputId}
          name={name}
          type={inputType}
          disabled={disabled}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy}
          className={cn("h-10 bg-background", isPassword && "pr-12", className)}
        />

        {isPassword && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            aria-label={
              isPasswordVisible
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
            aria-controls={inputId}
            className="absolute inset-y-0 right-0 h-full w-11 text-muted-foreground"
          >
            <VisibilityIcon className="size-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {error && <FieldError id={errorId}>{error}</FieldError>}
    </Field>
  );
}
