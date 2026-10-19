"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MuscleGroup } from "../contracts";
import type { ExercisesQuery } from "../query";

type ExercisesFiltersProps = {
  query: ExercisesQuery;
  groups: MuscleGroup[];
  pending: boolean;
  onChange: (patch: Partial<ExercisesQuery>) => void;
};

const scopes = [
  { value: "all", label: "Tous" },
  { value: "public", label: "Catalogue" },
  { value: "mine", label: "Mes exercices" },
] as const;

export function ExercisesFilters({
  query,
  groups,
  pending,
  onChange,
}: ExercisesFiltersProps) {
  const [draft, setDraft] = useState({
    value: query.search,
    applied: query.search,
    submitted: null as string | null,
  });

  if (draft.applied !== query.search) {
    // Keep text typed during a request; external URL changes reset the field.
    setDraft({
      value: query.search === draft.submitted ? draft.value : query.search,
      applied: query.search,
      submitted: null,
    });
  }

  useEffect(() => {
    const search = draft.value.trim();
    if (pending || search === query.search) return;

    const timeout = window.setTimeout(() => {
      setDraft((current) => ({ ...current, submitted: search }));
      onChange({ search });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [draft.value, query.search, pending, onChange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="search" className="flex w-full gap-2 sm:max-w-md">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              name="search"
              type="search"
              value={draft.value}
              onChange={(event) =>
                setDraft({ ...draft, value: event.target.value })
              }
              maxLength={120}
              aria-label="Rechercher un exercice"
              placeholder="Rechercher un exercice"
              className="bg-card pl-9"
            />
          </div>
        </div>
        <div
          role="group"
          aria-label="Origine des exercices"
          className="flex rounded-md border bg-card p-1"
        >
          {scopes.map((scope) => (
            <Button
              key={scope.value}
              type="button"
              size="sm"
              variant={query.scope === scope.value ? "secondary" : "ghost"}
              disabled={pending}
              aria-pressed={query.scope === scope.value}
              onClick={() => onChange({ scope: scope.value })}
              className="text-xs"
            >
              {scope.label}
            </Button>
          ))}
        </div>
      </div>
      <div
        role="group"
        aria-label="Filtrer par groupe musculaire"
        className="flex flex-wrap gap-2"
      >
        {[{ id: "", name: "Tous" }, ...groups].map((group) => {
          const active = (query.muscleGroupId ?? "") === group.id;
          return (
            <Button
              key={group.id}
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              aria-pressed={active}
              onClick={() => onChange({ muscleGroupId: group.id || undefined })}
              className={
                active
                  ? "border-primary/25 bg-primary/10 text-[#e7a69e]"
                  : "text-muted-foreground"
              }
            >
              {group.name}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
