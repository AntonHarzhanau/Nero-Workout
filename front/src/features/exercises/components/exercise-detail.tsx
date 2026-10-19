"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import type { User } from "@/features/auth/contracts";
import type { Exercise, MuscleGroup } from "../contracts";
import { DeleteExerciseButton } from "./delete-exercise-button";
import { ExerciseEditForm } from "./exercise-edit-form";
import { ExerciseInformation } from "./exercise-information";

type ExerciseDetailProps = {
  exercise: Exercise;
  groups: MuscleGroup[];
  user: Pick<User, "id" | "role">;
};

export function ExerciseDetail({
  exercise,
  groups,
  user,
}: ExerciseDetailProps) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const isOwner = exercise.ownerId === user.id;
  return (
    <section className="mx-auto max-w-3xl space-y-7">
      <PageHeader
        title={exercise.title}
        description={
          editing
            ? "Modifiez les informations de votre exercice."
            : "Les détails de votre exercice et les muscles travaillés."
        }
        backLink={{ href: "/exercises", label: "Tous les exercices" }}
      ></PageHeader>
      {notice && (
        <p
          role="status"
          className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
        >
          {notice}
        </p>
      )}

      {editing && isOwner ? (
        <ExerciseEditForm
          key={exercise.id}
          exercise={exercise}
          groups={groups}
          isAdmin={user.role === "admin"}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setNotice("Modifications enregistrées.");
          }}
        />
      ) : (
        <ExerciseInformation exercise={exercise} />
      )}

      {isOwner && !editing && (
        <div className="flex justify-end gap-3">
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

          <DeleteExerciseButton exercise={exercise} />
        </div>
      )}
      {!isOwner && (
        <p className="text-xs text-muted-foreground">
          Seul le propriétaire peut modifier cet exercice.
        </p>
      )}
    </section>
  );
}
