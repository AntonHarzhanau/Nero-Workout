import "server-only";
import { requireCurrentUser } from "../auth/get-current-user";
import { notFound, redirect } from "next/navigation";
import { readSession } from "../auth/session";
import { getLoginUrl } from "../auth/return-to";

export async function requireAdmin() {
  const user = await requireCurrentUser();

  if (user.role !== "admin") {
    notFound();
  }

  const { accessToken } = await readSession();

  if (!accessToken) {
    redirect(getLoginUrl("/users"));
  }

  return { user, accessToken };
}
