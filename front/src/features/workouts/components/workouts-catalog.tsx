"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { MuscleGroup } from "@/features/exercises/contracts";
import type { PlanSummary } from "@/features/plans/contracts";
import type { WorkoutSummary } from "../contracts";
import { WorkoutRow } from "./workout-row";
import { WorkoutFormDialog } from "./workout-form-dialog";
import { WorkoutsFilters } from "./workouts-filters";

const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("fr").trim();
export function WorkoutsCatalog({
  workouts,
  plans,
  groups,
  isAdmin,
  initialCreating = false,
}: {
  workouts: WorkoutSummary[];
  plans: PlanSummary[];
  groups: MuscleGroup[];
  isAdmin: boolean;
  initialCreating?: boolean;
}) {
  const [creating, setCreating] = useState(initialCreating);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("all");
  const router = useRouter();
  const months = [
    ...new Set(workouts.map((item) => item.workoutDate.slice(0, 7))),
  ]
    .sort()
    .reverse();
  const activeMonth = months.includes(month) ? month : "all";
  const filtered = workouts
    .filter(
      (item) =>
        normalize(item.title).includes(normalize(search)) &&
        (activeMonth === "all" || item.workoutDate.startsWith(activeMonth)),
    )
    .sort(
      (a, b) =>
        b.workoutDate.localeCompare(a.workoutDate) ||
        b.createdAt.localeCompare(a.createdAt),
    );
  const createButton = (
    <Button type="button" onClick={() => setCreating(true)}>
      <Plus aria-hidden="true" />
      Nouvelle séance
    </Button>
  );
  return (
    <section className="space-y-7">
      <PageHeader
        title="Séances"
        description="Retrouvez et modifiez vos entraînements."
      >
        {createButton}
      </PageHeader>
      <WorkoutsFilters
        search={search}
        month={activeMonth}
        months={months}
        onSearchChange={setSearch}
        onMonthChange={setMonth}
      />
      <Card className="gap-0 overflow-hidden pb-0">
        <CardHeader className="pb-5">
          <CardTitle className="font-heading text-2xl font-normal">
            Historique
          </CardTitle>
          <p role="status" className="text-xs text-muted-foreground">
            {filtered.length} séance{filtered.length !== 1 ? "s" : ""}
          </p>
        </CardHeader>
        {filtered.length ? (
          <div>
            {filtered.map((workout) => (
              <WorkoutRow key={workout.id} workout={workout} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title={
              workouts.length ? "Aucun résultat" : "Aucune séance enregistrée"
            }
            description={
              workouts.length
                ? "Essayez un autre nom ou une autre période."
                : "Créez votre première séance pour commencer."
            }
          >
            {!workouts.length && createButton}
          </EmptyState>
        )}
      </Card>
      {creating && (
        <WorkoutFormDialog
          groups={groups}
          plans={plans}
          isAdmin={isAdmin}
          onClose={() => {
            setCreating(false);
            if (initialCreating) router.replace("/workouts", { scroll: false });
          }}
          onSaved={(workout) => {
            setCreating(false);
            router.push(`/workouts/${workout.id}`);
          }}
        />
      )}
    </section>
  );
}
