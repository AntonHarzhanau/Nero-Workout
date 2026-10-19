"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { deleteAccountAction } from "@/features/auth/actions/delete-account";
import type { ActionError } from "@/features/auth/types";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionError | null, FormData>(
    deleteAccountAction,
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
          Supprimer mon compte
        </Button>
      }
      title="Supprimer votre compte ?"
      description="Votre compte, vos séances, vos plans et vos exercices personnels seront supprimés définitivement. Cette action est irréversible."
    />
  );
}
