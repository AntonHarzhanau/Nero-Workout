"use client";

import { FieldPath, FieldValues, useForm, UseFormProps } from "react-hook-form";
import { ActionError } from "../types";

type ActionFormOptions<T extends FieldValues> = {
  formOptions: UseFormProps<T>;
  action: (values: T) => Promise<ActionError | undefined>;
  fields: readonly FieldPath<T>[];
};

export function useActionForm<T extends FieldValues>({
  formOptions,
  action,
  fields,
}: ActionFormOptions<T>) {
  const form = useForm<T>(formOptions);

  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors();

    let result: ActionError | undefined;

    try {
      result = await action(values);
    } catch {
      form.setError("root", {
        message: "Impossible d'envoyer le formulaire. Réessayez",
      });

      return;
    }

    if (!result) {
      return;
    }

    form.setError("root", {
      message: result.message,
    });

    for (const field of fields) {
      const message = result.fieldErrors?.[field]?.[0];

      if (message) {
        form.setError(field, {
          type: "server",
          message,
        });
      }
    }
  });

  return { ...form, onSubmit };
}
