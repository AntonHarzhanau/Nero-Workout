import "server-only";
import { notFound } from "next/navigation";
import { requireSession } from "../auth/require-session";

export async function requireAdmin() {
  const { user, accessToken } = await requireSession("/users");

  if (user.role !== "admin") {
    notFound();
  }

  return { user, accessToken };
}
