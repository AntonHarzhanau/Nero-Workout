"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { readSession } from "@/features/auth/session";
import type { ActionError, ApiResult } from "@/lib/http/api-client";
import {
  exerciseFormSchema,
  type Exercise,
  type ExercisePayload,
} from "./contracts";
import { exercisesApi } from "./exercises-api";
import { mutationError, sessionError } from "@/lib/http/mutation-error";

const notFoundMessage = "Cet exercice n’existe plus ou n’est plus accessible.";

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
      error: mutationError(result.error, notFoundMessage),
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
    return mutationError(result.error, notFoundMessage);
  }

  revalidatePath("/exercises");
  redirect("/exercises");
}
