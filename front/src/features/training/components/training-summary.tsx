import { Card, CardContent } from "@/components/ui/card";
import { formatWeight, trainingTotals } from "../formatters";

type TrainingSummaryProps = {
  exercises: { sets: { weightKg: string | number; reps: number }[] }[];
  volumeLabel?: string;
};
export function TrainingSummary({
  exercises,
  volumeLabel = "Volume prévu · kg",
}: TrainingSummaryProps) {
  const totals = trainingTotals(exercises);
  return (
    <Card className="py-5">
      <CardContent className="grid grid-cols-3 gap-2 divide-x">
        {[
          { label: "Exercices", value: totals.exercises },
          { label: "Séries", value: totals.sets },
          { label: volumeLabel, value: formatWeight(totals.volume) },
        ].map((item) => (
          <div key={item.label} className="min-w-0 px-1 text-center">
            <p className="wrap-break-words font-heading text-2xl sm:text-3xl">
              {item.value}
            </p>
            <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">
              {item.label}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
