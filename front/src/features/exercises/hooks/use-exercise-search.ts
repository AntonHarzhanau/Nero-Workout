"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { exercisesPageSchema } from "../contracts";
import type { ApiResult } from "@/lib/http/api-client";
import type { ExercisesPage } from "../contracts";
const responseSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), data: exercisesPageSchema }),
  z.object({
    ok: z.literal(false),
    error: z.object({ message: z.string(), status: z.number().optional() }),
  }),
]);
export function useExerciseSearch(
  search: string,
  scope: "all" | "mine" | "public",
  page: number,
) {
  const key = new URLSearchParams({
    search: search.trim(),
    scope,
    page: String(page),
  }).toString();
  const [response, setResponse] = useState<{
    key: string;
    result: ApiResult<ExercisesPage>;
  } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/exercises?${key}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const parsed = responseSchema.safeParse(await response.json());
        if (!controller.signal.aborted)
          setResponse({
            key,
            result: parsed.success
              ? parsed.data
              : {
                  ok: false,
                  error: { message: "Impossible de charger les exercices." },
                },
          });
      } catch {
        if (!controller.signal.aborted)
          setResponse({
            key,
            result: {
              ok: false,
              error: { message: "Impossible de contacter le serveur." },
            },
          });
      }
    }, 300);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [key]);
  return {
    result: response?.key === key ? response.result : null,
    pending: response?.key !== key,
  };
}
