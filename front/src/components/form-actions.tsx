import { Button } from "@/components/ui/button";

type FormActionsProps = {
  pending: boolean;
  submitLabel: string;
  cancelLabel?: string;
  onCancel: () => void;
};

export function FormActions({
  pending,
  submitLabel,
  cancelLabel = "Annuler",
  onCancel,
}: FormActionsProps) {
  return (
    <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={onCancel}
      >
        {cancelLabel}
      </Button>
      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : submitLabel}
      </Button>
    </div>
  );
}
