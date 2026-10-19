"use client";
import { useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Dumbbell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrainingExerciseDraft, TrainingFormValues } from "../contracts";
import { TrainingSetsEditor } from "./training-sets-editor";

type TrainingExerciseEditorProps = {
  entry: TrainingExerciseDraft;
  index: number;
  count: number;
  maxSets: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
};
export function TrainingExerciseEditor({
  entry,
  index,
  count,
  maxSets,
  onMove,
  onRemove,
}: TrainingExerciseEditorProps) {
  const {
    register,
    formState: { isSubmitting },
  } = useFormContext<TrainingFormValues>();
  return (
    <Card size="sm" className="bg-background/40">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="flex min-w-0 items-start gap-2 text-sm font-normal">
            <Dumbbell
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-primary/70"
            />
            <span className="wrap-break-words">{entry.title}</span>
          </CardTitle>
          <div className="ml-auto flex shrink-0 gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={isSubmitting || index === 0}
              aria-label={`Monter ${entry.title}`}
              onClick={() => onMove(index, index - 1)}
            >
              <ArrowUp aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={isSubmitting || index === count - 1}
              aria-label={`Descendre ${entry.title}`}
              onClick={() => onMove(index, index + 1)}
            >
              <ArrowDown aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={isSubmitting}
              aria-label={`Retirer ${entry.title}`}
              onClick={onRemove}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <input type="hidden" {...register(`exercises.${index}.exerciseId`)} />
        <input type="hidden" {...register(`exercises.${index}.title`)} />
        <TrainingSetsEditor
          exerciseIndex={index}
          title={entry.title}
          maxSets={maxSets}
        />
      </CardContent>
    </Card>
  );
}
