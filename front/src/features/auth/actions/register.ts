"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { authApi } from "../auth-api";
import { registerSchema } from "../schemas";
import type { ActionError } from "../types";
import { getLoginUrl } from "../return-to";

export async function registerAction(
  returnTo: string,
  input: unknown,
): Promise<ActionError> {
  const parsed = registerSchema.safeParse(input);

  if (!parsed.success) {
    return {
      message: "Vérifiez les champs du formulaire.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const result = await authApi.register(parsed.data);

  if (!result.ok) {
    return result.error;
  }

  redirect(getLoginUrl(returnTo));
}
