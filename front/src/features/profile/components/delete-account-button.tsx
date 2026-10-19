"use client";

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
import { deleteAccountAction } from "@/features/auth/actions/delete-account";
import { ActionError } from "@/features/auth/types";
import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);

  const [state, formAction, pending] = useActionState<
    ActionError | null,
    FormData
  >(deleteAccountAction, null);

  function handleOpenChange(nextOpen: boolean) {
    if (!pending) {
      setOpen(nextOpen);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={<Button type="button" variant="destructive" />}
      >
        <Trash2 aria-hidden="true" />
        Supprimer mon compte
      </AlertDialogTrigger>

      <AlertDialogContent>
        <form action={formAction} aria-busy={pending} className="space-y-6">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>

            <AlertDialogDescription>
              Votre compte, vos séances, vos plans et vos exercices personnels
              seront supprimés définitivement. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {state?.message && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>
              Annuler
            </AlertDialogCancel>

            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Suppression..." : "Supprimer définitivement"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
