"use client";

import { useCallback, useSyncExternalStore } from "react";

const CHANGE_EVENT = "nero:statistics-exercise";
const memory = new Map<string, string>();

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

const serverSnapshot = () => "";

export function useSelectedExercise(
  userId: string,
  exercises: { id: string }[],
  initialId?: string,
) {
  const key = `nero:statistics:selected-exercise:${userId}`;
  const getSnapshot = useCallback(() => {
    try {
      return memory.get(key) ?? window.localStorage.getItem(key) ?? "";
    } catch {
      return memory.get(key) ?? "";
    }
  }, [key]);
  const saved = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const selectedId = exercises.some((exercise) => exercise.id === saved)
    ? saved
    : (exercises.find((exercise) => exercise.id === initialId)?.id ??
      exercises[0]?.id ??
      "");

  function selectExercise(id: string) {
    if (!exercises.some((exercise) => exercise.id === id)) return;
    try {
      window.localStorage.setItem(key, id);
      memory.delete(key);
    } catch {
      // Selection still works for this session when browser storage is blocked.
      memory.set(key, id);
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return [selectedId, selectExercise] as const;
}
