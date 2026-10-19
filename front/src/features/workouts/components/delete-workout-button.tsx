"use client";
import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import type { ActionError } from "@/lib/http/api-client";
import { deleteWorkoutAction } from "../actions";
export function DeleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionError | null, FormData>(
    deleteWorkoutAction.bind(null, workoutId),
    null,
  );
  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={setOpen}
      pending={pending}
      action={action}
      error={state?.message}
      title="Supprimer cette séance ?"
      description="La séance et ses séries seront supprimées définitivement. Les exercices du catalogue et vos plans seront conservés."
      trigger={
        <Button type="button" variant="destructive">
          <Trash2 aria-hidden="true" />
          Supprimer
        </Button>
      }
    />
  );
}
