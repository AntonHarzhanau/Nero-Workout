"use client";

import { useEffect, useRef, useState } from "react";
import { planSchema, type Plan } from "@/features/plans/contracts";
import { MAX_WORKOUT_EXERCISES, MAX_WORKOUT_SETS } from "../contracts";

export function usePlanTemplate(onApply: (plan: Plan) => void) {
  const [selectedId, setSelectedId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);

  async function select(id: string) {
    controller.current?.abort();
    setSelectedId(id);
    setError("");
    if (!id) {
      setPending(false);
      return;
    }
    const request = new AbortController();
    controller.current = request;
    setPending(true);
    try {
      const response = await fetch(`/api/plans/${encodeURIComponent(id)}`, {
        cache: "no-store",
        signal: request.signal,
      });
      const result = await response.json();
      if (request.signal.aborted) return;
      if (!response.ok || !result.ok)
        throw new Error(
          "Impossible de charger ce plan. Vérifiez qu’il est toujours accessible.",
        );
      const parsed = planSchema.safeParse(result.data);
      if (!parsed.success) throw new Error("Impossible de charger ce plan.");
      const plan = parsed.data;
      if (
        plan.exercises.length > MAX_WORKOUT_EXERCISES ||
        plan.exercises.some((item) => item.sets.length > MAX_WORKOUT_SETS)
      ) {
        setSelectedId("");
        setError(
          "Ce plan dépasse la limite d’une séance : 100 exercices et 100 séries par exercice. Réduisez le plan avant de l’utiliser.",
        );
        return;
      }
      onApply(plan);
    } catch {
      if (request.signal.aborted) return;
      setSelectedId("");
      setError(
        "Impossible de charger ce plan. Vérifiez qu’il est toujours accessible.",
      );
    } finally {
      if (!request.signal.aborted) setPending(false);
    }
  }
  return { selectedId, pending, error, select };
}
