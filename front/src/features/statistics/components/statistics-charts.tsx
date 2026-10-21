"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  type LucideIcon,
  CalendarDays,
  Clock3,
  Layers3,
  Weight,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import {
  dateLabel,
  numberLabel,
  type StatisticsPageData,
  type StrengthMetric,
} from "../view-model";
import { useStrengthCurve } from "../hooks/use-strength-curve";

const strengthConfig = {
  maxWeightKg: { label: "Poids maximal", color: "var(--primary)" },
  estimated1RmKg: { label: "1RM estimé", color: "#ceaa80" },
};

function MetricToggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex w-fit max-w-full flex-wrap gap-1 rounded-lg border border-border bg-background/40 p-1"
    >
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={value === option.value ? "secondary" : "ghost"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "h-7 text-xs",
            value !== option.value && "text-muted-foreground",
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function StatisticsNumbers({ data }: { data: StatisticsPageData }) {
  const current = data.report.summary;
  const previous = data.report.previousSummary;
  const items: {
    key: "workouts" | "sets" | "volumeKg" | "durationMinutes";
    label: string;
    icon: LucideIcon;
    value: string;
    unit?: string;
  }[] = [
    {
      key: "workouts",
      label: "Séances",
      icon: CalendarDays,
      value: numberLabel(current.workouts),
    },
    {
      key: "sets",
      label: "Séries réalisées",
      icon: Layers3,
      value: numberLabel(current.sets),
    },
    {
      key: "volumeKg",
      label: "Volume soulevé",
      icon: Weight,
      value: numberLabel(current.volumeKg / 1000, 1),
      unit: "t",
    },
    {
      key: "durationMinutes",
      label: "Temps d’entraînement",
      icon: Clock3,
      value:
        current.workouts > 0 && current.averageDurationMinutes === null
          ? "—"
          : `${Math.floor(current.durationMinutes / 60)} h`,
      unit:
        current.workouts > 0 && current.averageDurationMinutes === null
          ? undefined
          : `${current.durationMinutes % 60} min`,
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => {
        const change =
          previous && previous[item.key] > 0
            ? ((current[item.key] - previous[item.key]) / previous[item.key]) *
              100
            : null;
        return (
          <Card key={item.key} className="gap-4 py-5">
            <CardContent className="gap-4 px-4 sm:px-5">
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{item.label}</span>
                <item.icon
                  aria-hidden="true"
                  className="size-3.5 shrink-0"
                  strokeWidth={1.5}
                />
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
                <span className="text-3xl tracking-tight sm:text-4xl">
                  {item.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.unit}
                </span>
              </div>
              <p className="text-[11px] leading-5 text-muted-foreground">
                {data.period !== "all" && change !== null ? (
                  <>
                    <span
                      className={
                        change >= 0 ? "text-[#b7c1a8]" : "text-foreground"
                      }
                    >
                      {change > 0 ? "+" : ""}
                      {numberLabel(change, 1)} %
                    </span>{" "}
                    vs période précédente
                  </>
                ) : (
                  "Sur la période sélectionnée"
                )}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function ExerciseChart({
  exerciseId,
  onExerciseChange,
  data,
  detailed = false,
}: {
  exerciseId: string;
  onExerciseChange?: (id: string) => void;
  data: StatisticsPageData;
  detailed?: boolean;
}) {
  const [metric, setMetric] = useState<StrengthMetric>("maxWeightKg");
  const selectId = useId();
  const exerciseName = data.exercises.find(
    (exercise) => exercise.id === exerciseId,
  )?.name;
  const { curve, error, loading, retry } = useStrengthCurve(
    data.userId,
    exerciseId,
    data.report.from,
    data.report.to,
  );
  const points = curve?.points ?? [];
  const last = points.at(-1)?.[metric];
  const first = points[0]?.[metric];
  const best = points.length
    ? Math.max(...points.map((point) => point[metric]))
    : undefined;
  const difference =
    last !== undefined && first !== undefined && points.length > 1
      ? last - first
      : null;
  return (
    <Card className={detailed ? "gap-5" : "gap-4"}>
      <CardHeader className={detailed ? "gap-4" : "gap-3"}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-normal">
              {detailed ? "Évolution de la performance" : "Votre progression"}
            </CardTitle>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {detailed
                ? "Un exercice, vos résultats au fil du temps."
                : exerciseName}
            </p>
          </div>
          <ChartNoAxesCombined
            aria-hidden="true"
            className="mt-1 size-4 shrink-0 text-muted-foreground"
            strokeWidth={1.5}
          />
        </div>
        <div
          className={
            detailed
              ? "grid min-w-0 gap-3 sm:grid-cols-[minmax(0,18rem)_auto] sm:items-end sm:justify-between"
              : "flex flex-wrap"
          }
        >
          {detailed && (
            <div className="min-w-0 space-y-1.5">
              <label
                htmlFor={selectId}
                className="block text-[11px] text-muted-foreground"
              >
                Exercice à afficher
              </label>
              <NativeSelect
                id={selectId}
                aria-describedby={`${selectId}-hint`}
                value={exerciseId}
                disabled={data.exercises.length === 0}
                onChange={(event) => onExerciseChange?.(event.target.value)}
                className="w-full"
              >
                {!data.exercises.length && (
                  <NativeSelectOption value="">
                    Aucun exercice
                  </NativeSelectOption>
                )}
                {data.exercises.map((exercise) => (
                  <NativeSelectOption key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          )}
          <MetricToggle
            label="Mesure de la performance"
            value={metric}
            onChange={setMetric}
            options={[
              { value: "maxWeightKg", label: "Poids maximal" },
              { value: "estimated1RmKg", label: "1RM estimé" },
            ]}
          />
        </div>
        {detailed && (
          <p
            id={`${selectId}-hint`}
            className="text-[10px] text-muted-foreground"
          >
            Votre choix est mémorisé sur cet appareil.
          </p>
        )}
      </CardHeader>
      {loading ? (
        <CardContent>
          <div
            role="status"
            className={cn(
              "flex items-center justify-center text-sm text-muted-foreground",
              detailed ? "min-h-72" : "min-h-48",
            )}
          >
            Chargement de la courbe…
          </div>
        </CardContent>
      ) : error ? (
        <CardContent>
          <p role="alert" className="text-sm text-muted-foreground">
            {error}
          </p>
          <Button variant="outline" onClick={retry}>
            Réessayer
          </Button>
        </CardContent>
      ) : points.length ? (
        <>
          <CardContent className="gap-1">
            <div className="flex flex-wrap items-baseline gap-3">
              <strong className="text-4xl font-normal tracking-tight tabular-nums">
                {numberLabel(last!, 2)}
                <span className="ml-2 text-sm text-muted-foreground">kg</span>
              </strong>
              {difference !== null && (
                <span className="text-xs text-[#b7c1a8]">
                  {difference > 0 ? "+" : ""}
                  {numberLabel(difference, 2)} kg sur la période
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Dernier résultat · {dateLabel(points.at(-1)!.date)}
            </p>
          </CardContent>
          <div className="px-3 sm:px-5">
            <ChartContainer
              config={strengthConfig}
              className={cn(
                "aspect-auto w-full",
                detailed ? "h-56 sm:h-72" : "h-32",
              )}
              role="img"
              aria-label={`${strengthConfig[metric].label} : ${points.length} jours, de ${numberLabel(first!, 2)} à ${numberLabel(last!, 2)} kg`}
            >
              <LineChart
                accessibilityLayer
                data={points}
                margin={{ left: -18, right: 16, top: 15, bottom: 5 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => dateLabel(String(value))}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={35}
                  tickMargin={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  domain={[
                    (min: number) => Math.max(0, Math.floor(min - 5)),
                    (max: number) => Math.ceil(max + 5),
                  ]}
                  tickCount={4}
                  unit=""
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(label) =>
                        dateLabel(String(label), {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      }
                      formatter={(value) => (
                        <span className="tabular-nums">
                          {numberLabel(Number(value), 2)} kg
                        </span>
                      )}
                    />
                  }
                />
                <Line
                  type="linear"
                  dataKey={metric}
                  stroke={`var(--color-${metric})`}
                  strokeWidth={2}
                  dot={
                    points.length < 30
                      ? { r: 3, fill: "var(--card)", strokeWidth: 2 }
                      : false
                  }
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
          <CardContent className="mt-auto">
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-2 border-t text-xs",
                detailed ? "pt-4" : "pt-3",
              )}
            >
              <span className="text-muted-foreground">
                Meilleur sur la période{" "}
                <span className="ml-2 text-foreground">
                  {numberLabel(best!, 2)} kg
                </span>
              </span>
              {!detailed && (
                <Link
                  href="/progress"
                  className="flex items-center gap-1 hover:text-primary"
                >
                  Explorer{" "}
                  <ArrowUpRight aria-hidden="true" className="size-3.5" />
                </Link>
              )}
            </div>
            {detailed && metric === "estimated1RmKg" && (
              <p className="text-[10px] leading-5 text-muted-foreground">
                Estimation à partir du poids et des répétitions, pas un maximum
                testé.
              </p>
            )}
          </CardContent>
        </>
      ) : (
        <CardContent>
          {detailed ? (
            <EmptyState
              icon={ChartNoAxesCombined}
              title="L’histoire reste à écrire"
              description="Aucune mesure de charge pour cet exercice sur cette période. Choisissez un autre exercice ou une période plus longue."
            />
          ) : (
            <div className="flex min-h-40 flex-col justify-center gap-3 text-sm text-muted-foreground">
              <p>Aucune mesure de charge sur cette période.</p>
              <Link
                href="/progress"
                className="text-xs text-foreground hover:text-primary"
              >
                Choisir un autre exercice <span aria-hidden="true">↗</span>
              </Link>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function ActivityChart({ data }: { data: StatisticsPageData }) {
  const [metric, setMetric] = useState<"sets" | "workouts" | "volumeKg">(
    "sets",
  );
  const config = {
    sets: { label: "Séries", color: "#ba7366" },
    workouts: { label: "Séances", color: "#ba7366" },
    volumeKg: { label: "Volume · kg", color: "#ba7366" },
  };
  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle className="text-xl font-normal">
            Le rythme de vos semaines
          </CardTitle>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Chaque semaine compte, même les plus légères.
          </p>
        </div>
        <MetricToggle
          label="Mesure de l’activité"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "sets", label: "Séries" },
            { value: "workouts", label: "Séances" },
            { value: "volumeKg", label: "Volume" },
          ]}
        />
      </CardHeader>
      <CardContent className="gap-4">
        <ChartContainer
          config={config}
          className="aspect-auto h-56 w-full"
          role="img"
          aria-label={`${config[metric].label} par semaine sur la période sélectionnée`}
        >
          <BarChart
            accessibilityLayer
            data={data.report.weeks}
            margin={{ left: -22, right: 4, top: 8 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => dateLabel(String(value))}
              tickLine={false}
              axisLine={false}
              minTickGap={25}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              tickFormatter={(value) =>
                metric === "volumeKg"
                  ? `${numberLabel(Number(value) / 1000, 0)} t`
                  : String(value)
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) =>
                    `Semaine du ${dateLabel(String(label))}`
                  }
                  formatter={(value) => (
                    <span>
                      {numberLabel(Number(value))}{" "}
                      {metric === "volumeKg"
                        ? "kg"
                        : config[metric].label.toLowerCase()}
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey={metric}
              fill={`var(--color-${metric})`}
              radius={[4, 4, 0, 0]}
              maxBarSize={38}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
        <p className="text-[10px] leading-5 text-muted-foreground">
          Semaines du lundi au dimanche. Les semaines aux limites de la période
          peuvent être partielles.
        </p>
      </CardContent>
    </Card>
  );
}

export function MuscleChart({ data }: { data: StatisticsPageData }) {
  const [metric, setMetric] = useState<"sets" | "volumeKg">("sets");
  return (
    <Card>
      <CardHeader className="gap-4">
        <div>
          <CardTitle className="text-xl font-normal">
            Votre répartition musculaire
          </CardTitle>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Les groupes sollicités sur cette période.
          </p>
        </div>
        <MetricToggle
          label="Mesure par groupe musculaire"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "sets", label: "Séries" },
            { value: "volumeKg", label: "Volume" },
          ]}
        />
      </CardHeader>
      <CardContent className="gap-4">
        <ChartContainer
          config={{
            sets: { label: "Séries", color: "#ad6057" },
            volumeKg: { label: "Volume · kg", color: "#ad6057" },
          }}
          className="aspect-auto h-64 w-full"
          role="img"
          aria-label="Répartition de la charge par groupe musculaire"
        >
          <BarChart
            accessibilityLayer
            data={data.report.muscleGroups
              .map((group) => ({
                ...group,
                muscle:
                  data.groups.find((item) => item.code === group.muscleGroup)
                    ?.name ?? group.muscleGroup,
              }))
              .sort((a, b) => b[metric] - a[metric])}
            layout="vertical"
            margin={{ left: 0, right: 18 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="muscle"
              width={102}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => (
                    <span>
                      {numberLabel(Number(value))}{" "}
                      {metric === "sets" ? "séries" : "kg"}
                    </span>
                  )}
                />
              }
            />
            <Bar
              dataKey={metric}
              fill={`var(--color-${metric})`}
              radius={[0, 4, 4, 0]}
              maxBarSize={13}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
        <p className="text-[10px] leading-5 text-muted-foreground">
          Une série peut solliciter plusieurs groupes. Les valeurs par muscle ne
          s’additionnent pas au total.
        </p>
      </CardContent>
    </Card>
  );
}
