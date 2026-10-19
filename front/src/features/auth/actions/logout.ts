"use server";

import { redirect } from "next/navigation";
import { authApi } from "../auth-api";
import { clearSession, readSession } from "../session";
import type { ActionError } from "../types";

export async function logoutAction(
  _previousState: ActionError | null,
): Promise<ActionError> {
  const { refreshToken } = await readSession();

  if (refreshToken) {
    const result = await authApi.logout(refreshToken);

    if (!result.ok) {
      return result.error;
    }
  }

  await clearSession();

  redirect("/login");
}
