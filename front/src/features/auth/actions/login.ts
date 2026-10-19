"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { authApi } from "../auth-api";
import { loginSchema } from "../schemas";
import { saveSession } from "../session";
import type { ActionError } from "../types";
import { getSafeReturnTo } from "../return-to";

export async function loginAction(
  returnTo: unknown,
  input: unknown,
): Promise<ActionError> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return {
      message: "Vérifiez les champs du formulaire.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const result = await authApi.login(parsed.data);

  if (!result.ok) {
    return result.error;
  }

  await saveSession(result.data);

  redirect(getSafeReturnTo(returnTo));
}
