import { Card, CardContent } from "@/components/ui/card";

export function TrainingNotes({ description }: { description: string | null }) {
  if (!description) return null;
  return (
    <Card>
      <CardContent>
        <h2 className="font-heading text-xl">Notes</h2>
        <p className="whitespace-pre-wrap wrap-break-words text-sm leading-7 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
