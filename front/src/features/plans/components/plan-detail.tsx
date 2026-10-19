"use client";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import type { MuscleGroup } from "@/features/exercises/contracts";
import { TrainingExerciseList } from "@/features/training/components/training-exercise-list";
import { TrainingSummary } from "@/features/training/components/training-summary";
import { TrainingNotes } from "@/features/training/components/training-notes";
import { MAX_PLAN_EXERCISES, type Plan } from "../contracts";
import { PlanEditForm } from "./plan-edit-form";
import { DeletePlanButton } from "./delete-plan-button";
import { RemovePlanExerciseButton } from "./remove-plan-exercise-button";
import { AddPlanExerciseDialog } from "./add-plan-exercise-dialog";
export function PlanDetail({
  plan,
  groups,
  isAdmin,
}: {
  plan: Plan;
  groups: MuscleGroup[];
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  return (
    <section className="mx-auto max-w-3xl space-y-7">
      <PageHeader
        title={plan.title}
        description={
          editing
            ? "Ajustez les exercices, les poids et les séries de votre plan."
            : "Votre séance préparée, mouvement par mouvement."
        }
        backLink={{ href: "/plans", label: "Tous les plans" }}
      />
      {notice && (
        <p
          role="status"
          className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
        >
          {notice}
        </p>
      )}
      {editing ? (
        <PlanEditForm
          plan={plan}
          groups={groups}
          isAdmin={isAdmin}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setNotice("Modifications enregistrées.");
          }}
        />
      ) : (
        <>
          <TrainingSummary exercises={plan.exercises} />
          <TrainingNotes description={plan.description} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl">Exercices</h2>
            <Button
              type="button"
              variant="outline"
              disabled={plan.exercises.length >= MAX_PLAN_EXERCISES}
              onClick={() => {
                setNotice("");
                setAdding(true);
              }}
            >
              <Plus aria-hidden="true" />
              Ajouter un exercice
            </Button>
          </div>
          <TrainingExerciseList
            exercises={plan.exercises}
            renderActions={(item) => (
              <RemovePlanExerciseButton
                planId={plan.id}
                item={item}
                onRemoved={() => setNotice("Exercice retiré du plan.")}
              />
            )}
          />
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setNotice("");
                setEditing(true);
              }}
            >
              <Pencil aria-hidden="true" />
              Modifier
            </Button>
            <DeletePlanButton planId={plan.id} />
          </div>
        </>
      )}
      {adding && (
        <AddPlanExerciseDialog
          planId={plan.id}
          exerciseIds={plan.exercises.map((item) => item.exerciseId)}
          groups={groups}
          isAdmin={isAdmin}
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            setNotice("Exercice ajouté. Vous pouvez modifier ses séries.");
          }}
        />
      )}
    </section>
  );
}
