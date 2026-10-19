"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteUserAction } from "../actions/delete-user";
import type { DeleteUserState } from "../types";

type DeleteUserButtonProps = {
  userId: string;
  userName: string;
};

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const [open, setOpen] = useState(false);

  const action = deleteUserAction.bind(null, userId);

  const [state, formAction, pending] = useActionState<
    DeleteUserState,
    FormData
  >(action, { status: "idle" });

  function handleOpenChange(nextOpen: boolean) {
    if (!pending) {
      setOpen(nextOpen);
    }
  }

  return (
    <AlertDialog
      open={open && state.status !== "success"}
      onOpenChange={handleOpenChange}
    >
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Supprimer ${userName}`}
            className="text-destructive hover:text-destructive"
          />
        }
      >
        <Trash2 aria-hidden="true" />
      </AlertDialogTrigger>

      <AlertDialogContent>
        <form action={formAction} aria-busy={pending} className="space-y-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {userName} ?</AlertDialogTitle>

            <AlertDialogDescription>
              Le compte, les séances, les plans et les exercices personnels de
              cet utilisateur seront supprimés définitivement.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {state.status === "error" && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>
              Annuler
            </AlertDialogCancel>

            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
