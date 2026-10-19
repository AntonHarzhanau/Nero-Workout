"use client";

import type { ReactElement, ReactNode } from "react";
import { Button } from "@/components/ui/button";
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

type DeleteConfirmationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactElement;
  title: string;
  description: ReactNode;
  pending: boolean;
  confirmLabel?: string;
  pendingLabel?: string;
  error?: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  pending,
  error,
  action,
  confirmLabel = "Supprimer définitivement",
  pendingLabel = "Suppression…",
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen);
      }}
    >
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <form action={action} aria-busy={pending} className="space-y-6">
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel type="button" disabled={pending}>
              Annuler
            </AlertDialogCancel>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
