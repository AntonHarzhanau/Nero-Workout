"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FormDialogProps = {
  title: string;
  description: string;
  pending: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function FormDialog({
  title,
  description,
  pending,
  onClose,
  children,
  className,
}: FormDialogProps) {
  return (
    <Dialog
      open
      disablePointerDismissal
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <DialogContent
        showCloseButton={!pending}
        aria-busy={pending}
        className={cn("max-h-[90dvh] overflow-y-auto sm:max-w-xl", className)}
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-3xl font-normal">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
