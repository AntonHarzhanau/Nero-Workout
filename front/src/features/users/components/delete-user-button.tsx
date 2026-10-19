"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { deleteUserAction } from "../actions/delete-user";
import type { DeleteUserState } from "../types";

type DeleteUserButtonProps = { userId: string; userName: string };

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<DeleteUserState, FormData>(
    deleteUserAction.bind(null, userId),
    { status: "idle" },
  );
  return (
    <DeleteConfirmationDialog
      open={open && state.status !== "success"}
      onOpenChange={setOpen}
      pending={pending}
      action={action}
      error={state.status === "error" ? state.message : undefined}
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Supprimer ${userName}`}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
        </Button>
      }
      title={`Supprimer ${userName} ?`}
      description="Le compte, les séances, les plans et les exercices personnels de cet utilisateur seront supprimés définitivement."
    />
  );
}
