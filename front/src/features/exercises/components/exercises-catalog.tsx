"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ListPagination } from "@/components/list-pagination";
import { Button } from "@/components/ui/button";
import type { User } from "@/features/auth/contracts";
import type { ExercisesPage, MuscleGroup } from "../contracts";
import { exercisesHref, type ExercisesQuery } from "../query";
import { ExerciseFormDialog } from "./exercise-form-dialog";
import { ExercisesFilters } from "./exercises-filters";
import { ExercisesGrid } from "./exercises-grid";

type ExercisesCatalogProps = {
  result: ExercisesPage;
  groups: MuscleGroup[];
  query: ExercisesQuery;
  user: Pick<User, "id" | "role">;
};

export function ExercisesCatalog({
  result,
  groups,
  query,
  user,
}: ExercisesCatalogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);

  const navigate = useCallback(
    (patch: Partial<ExercisesQuery>) => {
      if (pending) return;
      const href = exercisesHref({ ...query, page: 1, ...patch });
      startTransition(() => {
        if ("search" in patch) {
          router.replace(href, { scroll: false });
        } else {
          router.push(href, { scroll: false });
        }
      });
    },
    [pending, query, router],
  );

  return (
    <section className="space-y-7">
      <PageHeader
        title="Exercices"
        description="Le catalogue et vos exercices personnels."
      >
        <Button
          type="button"
          disabled={pending}
          onClick={() => setCreating(true)}
        >
          <Plus aria-hidden="true" />
          Créer un exercice
        </Button>
      </PageHeader>
      <ExercisesFilters
        query={query}
        groups={groups}
        pending={pending}
        onChange={navigate}
      />
      <div
        aria-busy={pending}
        className={pending ? "space-y-4 opacity-60" : "space-y-4"}
      >
        <p role="status" className="text-xs text-muted-foreground">
          {pending
            ? "Chargement des exercices…"
            : `${result.meta.total} exercice${result.meta.total === 1 ? "" : "s"}`}
        </p>
        <ExercisesGrid
          exercises={result.data}
          userId={user.id}
          pending={pending}
          onCreate={() => setCreating(true)}
          onResetFilters={() =>
            navigate({ search: "", scope: "all", muscleGroupId: undefined })
          }
        />
      </div>
      <ListPagination
        meta={result.meta}
        pending={pending}
        onPageChange={(page) => navigate({ page })}
      />
      {creating && (
        <ExerciseFormDialog
          groups={groups}
          isAdmin={user.role === "admin"}
          onClose={() => setCreating(false)}
          onSaved={(exercise) => {
            setCreating(false);
            router.push(`/exercises/${exercise.id}`);
          }}
        />
      )}
    </section>
  );
}
