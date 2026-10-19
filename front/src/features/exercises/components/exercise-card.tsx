import Link from "next/link";
import { ArrowUpRight, Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Exercise } from "../contracts";

export function ExerciseCard({
  exercise,
  isOwner,
}: {
  exercise: Exercise;
  isOwner: boolean;
}) {
  return (
    <Link
      href={`/exercises/${exercise.id}`}
      className="group min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full transition-colors group-hover:bg-accent/40 group-hover:ring-primary/30">
        <CardContent className="h-full gap-0">
          <div className="mb-6 flex items-center justify-between gap-2">
            <Dumbbell
              aria-hidden="true"
              className="size-6 text-primary/70"
              strokeWidth={1.25}
            />
            <div className="flex flex-wrap justify-end gap-1">
              {isOwner && (
                <Badge
                  variant="outline"
                  className="border-primary/20 text-[#cda39d]"
                >
                  Personnel
                </Badge>
              )}
              {exercise.visibility === "public" && (
                <Badge variant="secondary">Public</Badge>
              )}
            </div>
          </div>
          <h2 className="wrap-break-words font-heading text-[25px] leading-tight">
            {exercise.title}
          </h2>
          <p className="mt-2 mb-5 text-xs text-muted-foreground">
            {exercise.muscleGroups.map((group) => group.name).join(" · ") ||
              "Groupe non renseigné"}
          </p>
          <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3 text-xs text-muted-foreground">
            <span className="min-w-0 truncate">
              {exercise.equipment || "Matériel non renseigné"}
            </span>
            <ArrowUpRight
              aria-hidden="true"
              className="size-4 shrink-0 transition group-hover:text-foreground"
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
