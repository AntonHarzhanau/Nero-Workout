import { Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Exercise } from "../contracts";

export function ExerciseInformation({ exercise }: { exercise: Exercise }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-lg">
          <Dumbbell
            aria-hidden="true"
            className="size-5 text-primary/70"
            strokeWidth={1.25}
          />
          À propos de cet exercice
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-6">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <dt className="text-xs text-muted-foreground">Matériel</dt>
            <dd className="wrap-break-words">
              {exercise.equipment || "Non renseigné"}
            </dd>
          </div>
          <div className="space-y-2">
            <dt className="text-xs text-muted-foreground">Visibilité</dt>
            <dd>
              <Badge
                variant={
                  exercise.visibility === "public" ? "secondary" : "outline"
                }
              >
                {exercise.visibility === "public"
                  ? "Catalogue public"
                  : "Personnel"}
              </Badge>
            </dd>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">
              Groupes musculaires
            </dt>
            <dd className="flex flex-wrap gap-2">
              {exercise.muscleGroups.length
                ? exercise.muscleGroups.map((group) => (
                    <Badge
                      key={group.id}
                      variant="outline"
                      className="border-primary/20 text-[#cda39d]"
                    >
                      {group.name}
                    </Badge>
                  ))
                : "Non renseignés"}
            </dd>
          </div>
        </dl>
        <Separator />
        <div>
          <h2 className="font-heading text-xl">Description</h2>
          <p className="mt-3 whitespace-pre-wrap wrap-break-words text-sm leading-7 text-muted-foreground">
            {exercise.description || "Aucune description ajoutée."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
