"use client";
import { useState, useTransition } from "react";
import type { ApiResult } from "@/lib/http/api-client";
export function useApiMutation<T>(onSuccess: (data: T) => void) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  function run(action: () => Promise<ApiResult<T>>) {
    if (pending) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await action();
        if (!result.ok) {
          setError(result.error.message);
          return;
        }
        onSuccess(result.data);
      } catch {
        setError(
          "Impossible de confirmer l’opération. Actualisez la page pour vérifier.",
        );
      }
    });
  }
  return { pending, error, run };
}
