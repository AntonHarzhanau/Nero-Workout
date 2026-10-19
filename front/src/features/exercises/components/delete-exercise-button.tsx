"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import type { ActionError } from "@/lib/http/api-client";
import { deleteExerciseAction } from "../actions";
import type { Exercise } from "../contracts";

export function DeleteExerciseButton({ exercise }: { exercise: Exercise }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionError | null, FormData>(
    deleteExerciseAction.bind(null, exercise.id),
    null,
  );
  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={setOpen}
      pending={pending}
      action={action}
      error={state?.message}
      trigger={
        <Button type="button" variant="destructive">
          <Trash2 aria-hidden="true" />
          Supprimer
        </Button>
      }
      title="Supprimer cet exercice ?"
      description={
        <>
          « {exercise.title} » sera supprimé définitivement. Ses occurrences et
          leurs séries seront également supprimées de vos plans et séances.
        </>
      }
    />
  );
}
