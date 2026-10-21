"use client";

import { useEffect, useState } from "react";
import { strengthCurveSchema, type StrengthCurve } from "../contracts";

export function useStrengthCurve(
  userId: string,
  exerciseId: string,
  from: string,
  to: string,
) {
  const key = `${userId}:${exerciseId}:${from}:${to}`;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    curve?: StrengthCurve;
    error?: string;
  } | null>(null);
  useEffect(() => {
    if (!exerciseId) return;
    const controller = new AbortController();
    async function load() {
      try {
        const params = new URLSearchParams({ exerciseId, from, to });
        const response = await fetch(
          `/api/statistics/strength-curve?${params}`,
          { signal: controller.signal, cache: "no-store" },
        );
        const body = await response.json();
        if (response.status === 401) {
          if (!controller.signal.aborted)
            setResult({
              key,
              error: "Votre session a expiré. Reconnectez-vous.",
            });
          return;
        }
        if (!response.ok || !body.ok) throw new Error("Unavailable");
        const curve = strengthCurveSchema.parse(body.data);
        if (!controller.signal.aborted) setResult({ key, curve });
      } catch {
        if (!controller.signal.aborted)
          setResult({
            key,
            error:
              "Impossible de charger la courbe. Réessayez dans un instant.",
          });
      }
    }
    void load();
    return () => controller.abort();
  }, [userId, exerciseId, from, to, key, attempt]);
  return {
    curve: result?.key === key ? result.curve : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: Boolean(exerciseId) && result?.key !== key,
    retry: () => setAttempt((value) => value + 1),
  };
}
