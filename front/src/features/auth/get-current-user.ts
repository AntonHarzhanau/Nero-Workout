import { cache } from "react";
import "server-only";
import { readSession } from "./session";
import { authApi } from "./auth-api";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getLoginUrl } from "./return-to";

export const getCurrentUser = cache(async () => {
  const { accessToken } = await readSession();

  if (!accessToken) {
    return null;
  }

  const result = await authApi.getMe(accessToken);

  if (result.ok) {
    return result.data;
  }

  if (result.error.status === 401) {
    return null;
  }

  throw new Error(result.error.message);
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    const requestHeaders = await headers();
    const returnTo = requestHeaders.get("x-nero-path") ?? "/dashboard";

    redirect(getLoginUrl(returnTo));
  }

  return user;
}
