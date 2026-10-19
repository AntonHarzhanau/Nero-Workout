"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

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
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-sm font-medium">
        {label}
      </label>

      <div className="relative">
        <input
          {...inputProps}
          id={inputId}
          name={name}
          type={inputType}
          disabled={disabled}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy}
          className={cn(
            "h-10 w-full rounded-md border border-input bg-background px-3",
            "outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "aria-invalid:border-destructive",
            "disabled:cursor-not-allowed disabled:opacity-50",
            isPassword && "pr-12",
            className,
          )}
        />

        {isPassword && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            aria-label={
              isPasswordVisible
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
            aria-controls={inputId}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
          >
            <VisibilityIcon className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {error && (
        <p id={errorId} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
