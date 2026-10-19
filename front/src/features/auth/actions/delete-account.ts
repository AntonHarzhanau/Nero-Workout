"use server";

import { redirect } from "next/navigation";
import { requireCurrentUser } from "../get-current-user";
import { clearSession, readSession } from "../session";
import type { ActionError } from "../types";
import { getLoginUrl } from "../return-to";
import { authApi } from "../auth-api";

export async function deleteAccountAction(): Promise<ActionError> {
  await requireCurrentUser();

  const { accessToken } = await readSession();

  if (!accessToken) {
    await clearSession();
    redirect(getLoginUrl("/profile"));
  }

  const result = await authApi.deleteMe(accessToken);

  if (!result.ok) {
    if (result.error.status === 401) {
      await clearSession();
      redirect(getLoginUrl("/profile"));
    }

    return {
      message: result.error.message,
    };
  }

  await clearSession();
  redirect("/login");
}
