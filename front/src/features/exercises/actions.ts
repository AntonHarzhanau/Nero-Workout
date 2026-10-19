"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { readSession } from "@/features/auth/session";
import type { ActionError, ApiError, ApiResult } from "@/lib/http/api-client";
import {
  exerciseFormSchema,
  type Exercise,
  type ExercisePayload,
} from "./contracts";
import { exercisesApi } from "./exercises-api";

const sessionError: ApiError = {
  status: 401,
  message: "Votre session a expiré. Reconnectez-vous.",
};

function mutationError(error: ApiError): ApiError {
  if (error.status === 401) {
    return sessionError;
  }

  if (error.status === 403) {
    return {
      ...error,
      message: "Vous n’avez pas l’autorisation d’effectuer cette opération.",
    };
  }

  if (error.status === 404) {
    return {
      ...error,
      message: "Cet exercice n’existe plus ou n’est plus accessible.",
    };
  }

  return error;
}

export async function saveExerciseAction(
  exerciseId: unknown,
  values: unknown,
): Promise<ApiResult<Exercise>> {
  const { accessToken } = await readSession();

  if (!accessToken) {
    return { ok: false, error: sessionError };
  }

  const parsed = exerciseFormSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      error: {
        message: "Vérifiez les champs du formulaire.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
      },
    };
  }

  let id: string | null = null;

  if (exerciseId !== null) {
    const parsedId = z.uuid().safeParse(exerciseId);

    if (!parsedId.success) {
      return {
        ok: false,
        error: { message: "Identifiant d’exercice invalide." },
      };
    }

    id = parsedId.data;
  }

  const payload: ExercisePayload = {
    title: parsed.data.title,
    description: parsed.data.description.trim() || null,
    equipment: parsed.data.equipment.trim() || null,
    visibility: parsed.data.visibility,
    muscleGroups: parsed.data.muscleGroups,
  };

  const result = id
    ? await exercisesApi.update(id, payload, accessToken)
    : await exercisesApi.create(payload, accessToken);

  if (!result.ok) {
    return {
      ok: false,
      error: mutationError(result.error),
    };
  }

  revalidatePath("/exercises");
  if (id) revalidatePath(`/exercises/${id}`);

  return result;
}

export async function deleteExerciseAction(
  exerciseId: unknown,
): Promise<ActionError> {
  const { accessToken } = await readSession();

  if (!accessToken) {
    return sessionError;
  }

  const parsed = z.uuid().safeParse(exerciseId);

  if (!parsed.success) {
    return { message: "Identifiant d’exercice invalide." };
  }

  const result = await exercisesApi.delete(parsed.data, accessToken);

  if (!result.ok) {
    return mutationError(result.error);
  }

  revalidatePath("/exercises");
  redirect("/exercises");
}
