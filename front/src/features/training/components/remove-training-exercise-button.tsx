"use client";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Button } from "@/components/ui/button";
import { useApiMutation } from "@/hooks/use-api-mutation";
import type { TrainingExercise } from "@/features/training/contracts";
import type { ApiResult } from "@/lib/http/api-client";
export function RemoveTrainingExerciseButton({
  action,
  containerLabel,
  item,
  onRemoved,
}: {
  action: () => Promise<ApiResult<void>>;
  containerLabel: string;
  item: TrainingExercise;
  onRemoved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const mutation = useApiMutation<void>(() => {
    setOpen(false);
    onRemoved();
  });
  return (
    <DeleteConfirmationDialog
      open={open}
      onOpenChange={setOpen}
      pending={mutation.pending}
      error={mutation.error}
      action={() => mutation.run(action)}
      title={`Retirer cet exercice ${containerLabel} ?`}
      description={
        <>
          « {item.exercise.title} » et ses séries seront retirés{" "}
          {containerLabel}. L’exercice restera disponible dans le catalogue.
        </>
      }
      confirmLabel="Retirer"
      pendingLabel="Retrait…"
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Retirer ${item.exercise.title} ${containerLabel}`}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      }
    />
  );
}
