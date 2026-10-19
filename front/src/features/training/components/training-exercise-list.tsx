import Link from "next/link";
import type { ReactNode } from "react";
import { ClipboardList, Dumbbell } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TrainingExercise } from "../contracts";
import { formatWeight } from "../formatters";

export function TrainingExerciseList({
  exercises,
  renderActions,
}: {
  exercises: TrainingExercise[];
  renderActions?: (item: TrainingExercise) => ReactNode;
}) {
  if (!exercises.length)
    return (
      <EmptyState
        icon={ClipboardList}
        title="Aucun exercice"
        description="Ajoutez un mouvement pour préparer votre séance."
      />
    );
  return (
    <div className="space-y-4">
      {exercises.map((item, index) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <Link
                  href={`/exercises/${item.exerciseId}`}
                  className="flex items-start gap-2 font-heading text-xl hover:text-primary"
                >
                  <Dumbbell
                    aria-hidden="true"
                    className="mt-1 size-4 shrink-0 text-primary/70"
                  />
                  <span className="wrap-break-words">
                    {index + 1}. {item.exercise.title}
                  </span>
                </Link>
                <div className="flex flex-wrap gap-1">
                  {item.exercise.muscleGroups.map((group) => (
                    <Badge key={group.id} variant="outline">
                      {group.name}
                    </Badge>
                  ))}
                </div>
              </div>
              {renderActions?.(item)}
            </div>
          </CardHeader>
          <CardContent>
            {item.sets.length ? (
              <Table aria-label={`Séries ${item.exercise.title}`}>
                <TableHeader>
                  <TableRow>
                    <TableHead>Série</TableHead>
                    <TableHead>Poids · kg</TableHead>
                    <TableHead className="text-right">Répétitions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.sets.map((set, index) => (
                    <TableRow key={set.id}>
                      <TableCell className="text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>{formatWeight(set.weightKg)}</TableCell>
                      <TableCell className="text-right">{set.reps}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucune série renseignée.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
