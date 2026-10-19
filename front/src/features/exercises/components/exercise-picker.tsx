"use client";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { FormDialog } from "@/components/form-dialog";
import { ListPagination } from "@/components/list-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field";
import type { Exercise, MuscleGroup } from "../contracts";
import { useExerciseSearch } from "../hooks/use-exercise-search";
import { ExerciseFormDialog } from "./exercise-form-dialog";
import { ExercisePickerResults } from "./exercise-picker-results";

type ExercisePickerProps = {
  groups: MuscleGroup[];
  isAdmin: boolean;
  excludeIds?: string[];
  pending?: boolean;
  error?: string;
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
};
export function ExercisePicker({
  groups,
  isAdmin,
  excludeIds = [],
  pending = false,
  error,
  onSelect,
  onClose,
}: ExercisePickerProps) {
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const lookup = useExerciseSearch(search, scope, page);
  const data = lookup.result?.ok ? lookup.result.data : null;
  return (
    <FormDialog
      title="Ajouter un exercice"
      description="Choisissez un mouvement dans le catalogue ou créez le vôtre."
      pending={pending}
      onClose={onClose}
    >
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Rechercher un exercice"
          placeholder="Rechercher un exercice"
          maxLength={120}
          value={search}
          disabled={pending}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>
      <div
        role="group"
        aria-label="Origine des exercices"
        className="flex gap-2"
      >
        {(
          [
            ["all", "Tous"],
            ["mine", "Mes exercices"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={scope === value ? "secondary" : "ghost"}
            disabled={pending}
            onClick={() => {
              setScope(value);
              setPage(1);
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      <ExercisePickerResults
        result={lookup.result}
        loading={lookup.pending}
        pending={pending}
        excludeIds={excludeIds}
        onSelect={onSelect}
      />
      {data && (
        <ListPagination
          meta={data.meta}
          pending={pending || lookup.pending}
          onPageChange={setPage}
        />
      )}
      {error && <FieldError>{error}</FieldError>}
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => setCreating(true)}
      >
        <Plus aria-hidden="true" />
        Créer un exercice
      </Button>
      {creating && (
        <ExerciseFormDialog
          groups={groups}
          isAdmin={isAdmin}
          onClose={() => setCreating(false)}
          onSaved={(exercise) => {
            setCreating(false);
            onSelect(exercise);
          }}
        />
      )}
    </FormDialog>
  );
}
