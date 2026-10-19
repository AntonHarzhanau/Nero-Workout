"use client";
import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import type { ActionError } from "@/lib/http/api-client";
import { deletePlanAction } from "../actions";
export function DeletePlanButton({ planId }: { planId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionError | null, FormData>(
    deletePlanAction.bind(null, planId),
    null,
  );
  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={setOpen}
      pending={pending}
      action={action}
      error={state?.message}
      title="Supprimer ce plan ?"
      description="Le plan et ses séries seront supprimés définitivement. Les exercices du catalogue et vos séances seront conservés."
      trigger={
        <Button type="button" variant="destructive">
          <Trash2 aria-hidden="true" />
          Supprimer
        </Button>
      }
    />
  );
}
