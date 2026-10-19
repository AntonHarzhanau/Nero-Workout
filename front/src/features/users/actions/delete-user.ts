"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getLoginUrl } from "@/features/auth/return-to";
import { requireAdmin } from "../require-admin";
import type { DeleteUserState } from "../types";
import { usersApi } from "../users-api";

export async function deleteUserAction(
  userId: unknown,
): Promise<DeleteUserState> {
  const { user: admin, accessToken } = await requireAdmin();

  const parsed = z.uuid().safeParse(userId);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Identifiant utilisateur invalide.",
    };
  }

  if (parsed.data === admin.id) {
    return {
      status: "error",
      message: "Utilisez votre profil pour supprimer votre compte.",
    };
  }

  const result = await usersApi.delete(
    parsed.data,
    accessToken,
  );

  if (!result.ok) {
    if (result.error.status === 401) {
      redirect(getLoginUrl("/users"));
    }

    return {
      status: "error",
      message:
        result.error.status === 403
          ? "Vous ne pouvez pas supprimer cet utilisateur."
          : result.error.message,
    };
  }

  revalidatePath("/users");

  return { status: "success" };
}