"use client";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import type { MuscleGroup } from "@/features/exercises/contracts";
import { TrainingExerciseList } from "@/features/training/components/training-exercise-list";
import { TrainingNotes } from "@/features/training/components/training-notes";
import { MAX_WORKOUT_EXERCISES, type Workout } from "../contracts";
import { WorkoutEditForm } from "./workout-edit-form";
import { WorkoutOverview } from "./workout-overview";
import { DeleteWorkoutButton } from "./delete-workout-button";
import { RemoveWorkoutExerciseButton } from "./remove-workout-exercise-button";
import { AddWorkoutExerciseDialog } from "./add-workout-exercise-dialog";

export function WorkoutDetail({
  workout,
  groups,
  isAdmin,
}: {
  workout: Workout;
  groups: MuscleGroup[];
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");
  return (
    <section className="mx-auto max-w-3xl space-y-7">
      <PageHeader
        title={workout.title}
        description={
          editing
            ? "Ajustez la date, la durée, les exercices et les séries de votre séance."
            : "Votre entraînement, mouvement par mouvement."
        }
        backLink={{ href: "/workouts", label: "Toutes les séances" }}
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
        <WorkoutEditForm
          workout={workout}
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
          <WorkoutOverview workout={workout} />
          <TrainingNotes description={workout.description} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-heading text-2xl">Exercices</h2>
            <Button
              type="button"
              variant="outline"
              disabled={workout.exercises.length >= MAX_WORKOUT_EXERCISES}
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
            exercises={workout.exercises}
            renderActions={(item) => (
              <RemoveWorkoutExerciseButton
                workoutId={workout.id}
                item={item}
                onRemoved={() => setNotice("Exercice retiré de la séance.")}
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
            <DeleteWorkoutButton workoutId={workout.id} />
          </div>
        </>
      )}
      {adding && (
        <AddWorkoutExerciseDialog
          workoutId={workout.id}
          exerciseIds={workout.exercises.map((item) => item.exerciseId)}
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
