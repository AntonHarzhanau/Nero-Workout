import "server-only";

import { redirect } from "next/navigation";
import { requireCurrentUser } from "./get-current-user";
import { getLoginUrl } from "./return-to";
import { readSession } from "./session";

export async function requireSession(returnTo: string) {
  const user = await requireCurrentUser();
  const { accessToken } = await readSession();

  if (!accessToken) redirect(getLoginUrl(returnTo));

  return { user, accessToken };
}
