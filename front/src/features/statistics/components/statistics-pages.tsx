"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { WorkoutRow } from "@/features/workouts/components/workout-row";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Plus,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  addDays,
  dateLabel,
  initialExercise,
  mondayOf,
  numberLabel,
  statisticsPeriods,
  type StatisticsPeriod,
  type StatisticsPageData,
} from "../view-model";
import { useSelectedExercise } from "../hooks/use-selected-exercise";
import {
  ActivityChart,
  ExerciseChart,
  MuscleChart,
  StatisticsNumbers,
} from "./statistics-charts";

function PeriodPicker({
  period,
  onChange,
}: {
  period: StatisticsPeriod;
  onChange: (period: StatisticsPeriod) => void;
}) {
  return (
    <NativeSelect
      aria-label="Période des statistiques"
      value={period}
      onChange={(event) => onChange(event.target.value as StatisticsPeriod)}
    >
      {statisticsPeriods.map((item) => (
        <NativeSelectOption key={item.id} value={item.id}>
          {item.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

function WeekCalendar({ data }: { data: StatisticsPageData }) {
  const [offset, setOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(data.today);
  const anchor = mondayOf(data.today);
  const monday = addDays(anchor, offset * 7);
  const days = Array.from({ length: 7 }, (_, index) => addDays(monday, index));
  const workouts = data.workouts.filter(
    (workout) => workout.workoutDate <= data.today,
  );
  const sessions = workouts.filter(
    (workout) => workout.workoutDate === selectedDate,
  );
  const weekSessions = workouts.filter(
    (workout) =>
      workout.workoutDate >= monday &&
      workout.workoutDate <= addDays(monday, 6),
  );
  const earliest = workouts.reduce(
    (first, workout) =>
      workout.workoutDate < first ? workout.workoutDate : first,
    data.today,
  );
  const minOffset = Math.floor(
    (Date.parse(mondayOf(earliest)) - Date.parse(anchor)) / 604800000,
  );
  function changeWeek(nextOffset: number) {
    setOffset(nextOffset);
    setSelectedDate(addDays(anchor, nextOffset * 7));
  }
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-xl font-normal">
            {offset === 0 ? "Cette semaine" : "Votre calendrier"}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Semaine précédente"
              disabled={offset <= minOffset}
              onClick={() => changeWeek(offset - 1)}
            >
              <ChevronLeft />
            </Button>
            <span className="text-[11px] text-muted-foreground">
              {dateLabel(monday)} — {dateLabel(days[6])}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Semaine suivante"
              disabled={offset === 0}
              onClick={() => changeWeek(offset + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {weekSessions.length} séance{weekSessions.length !== 1 ? "s" : ""}{" "}
          enregistrée{weekSessions.length !== 1 ? "s" : ""} cette semaine
        </p>
      </CardHeader>
      <CardContent className="gap-5">
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const trained = workouts.some(
              (workout) => workout.workoutDate === day,
            );
            return (
              <button
                key={day}
                type="button"
                aria-pressed={selectedDate === day}
                aria-label={`${dateLabel(day, { weekday: "long", day: "numeric", month: "long" })}${trained ? ", séance enregistrée" : ""}`}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-3 rounded-lg border border-transparent px-1 py-3 transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring",
                  selectedDate === day && "border-primary/30 bg-primary/8",
                  day > data.today && "text-muted-foreground",
                )}
              >
                <span className="text-[10px] uppercase text-muted-foreground">
                  {dateLabel(day, { weekday: "short" }).replace(".", "")}
                </span>
                <span
                  className={cn(
                    "text-xl tabular-nums",
                    selectedDate === day && "text-[#ecaaa0]",
                  )}
                >
                  {dateLabel(day, { day: "numeric" })}
                </span>
                <span
                  className={cn(
                    "size-1 rounded-full",
                    trained ? "bg-primary" : "bg-transparent",
                  )}
                />
              </button>
            );
          })}
        </div>
        <div className="min-h-36 rounded-lg border border-primary/15 bg-primary/5 p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#d7a49a]">
              {selectedDate === data.today
                ? "Aujourd’hui"
                : dateLabel(selectedDate, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
            </span>
            {sessions.length > 0 && (
              <Badge
                variant="outline"
                className="border-primary/20 font-normal text-[#d7a49a]"
              >
                Enregistrée
              </Badge>
            )}
          </div>
          {sessions.length ? (
            sessions.map((workout) => (
              <Link
                key={workout.id}
                href={`/workouts/${workout.id}`}
                className="block rounded-md py-1 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
              >
                <h3 className="font-heading text-2xl">{workout.title}</h3>
                <p className="mt-3 text-xs text-muted-foreground">
                  {workout.durationMinutes === null
                    ? "Durée non renseignée"
                    : `${workout.durationMinutes} min`}
                  <ArrowUpRight
                    aria-hidden="true"
                    className="ml-2 inline size-3"
                  />
                </p>
              </Link>
            ))
          ) : (
            <>
              <h3 className="font-heading text-2xl">À votre rythme</h3>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Aucune séance enregistrée ce jour.
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Records({ data }: { data: StatisticsPageData }) {
  const records = data.report.records.slice(0, 4);
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl font-normal">
            Les derniers caps franchis
          </CardTitle>
          <Trophy
            aria-hidden="true"
            className="size-4 text-[#ceaa80]"
            strokeWidth={1.5}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Nouveaux records personnels sur la période.
        </p>
      </CardHeader>
      <CardContent className="gap-0">
        {records.length ? (
          records.map((record, index) => (
            <div
              key={`${record.date}-${record.exerciseId}-${index}`}
              className="flex items-center justify-between gap-3 border-b py-4 text-left last:border-0"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm">
                  {record.exerciseName}
                </span>
                <span className="mt-1.5 block text-[11px] text-muted-foreground">
                  {dateLabel(record.date)} · précédent :{" "}
                  {numberLabel(record.previousWeightKg, 2)} kg
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-lg tabular-nums">
                  {numberLabel(record.weightKg, 2)}{" "}
                  <span className="text-xs text-muted-foreground">kg</span>
                </span>
                <span className="text-[10px] text-[#ceaa80]">
                  +{numberLabel(record.weightKg - record.previousWeightKg, 2)}{" "}
                  kg
                </span>
              </span>
            </div>
          ))
        ) : (
          <p className="py-8 text-sm leading-6 text-muted-foreground">
            Aucun nouveau record sur cette période. Chaque séance enrichit votre
            historique.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function RecentWorkouts({ data }: { data: StatisticsPageData }) {
  const workouts = data.workouts
    .filter(
      (workout) =>
        workout.workoutDate >= data.report.from &&
        workout.workoutDate <= data.report.to,
    )
    .sort(
      (a, b) =>
        b.workoutDate.localeCompare(a.workoutDate) ||
        b.createdAt.localeCompare(a.createdAt),
    )
    .slice(0, 3);
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardTitle className="text-xl font-normal">Dernières séances</CardTitle>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Un regard sur vos derniers entraînements.
        </p>
      </CardHeader>
      {workouts.length ? (
        <div>
          {workouts.map((workout) => (
            <WorkoutRow key={workout.id} workout={workout} />
          ))}
        </div>
      ) : (
        <CardContent>
          <p className="py-6 text-sm text-muted-foreground">
            Aucune séance sur cette période.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

function Consistency({ data }: { data: StatisticsPageData }) {
  const start = data.report.from;
  const trained = new Set(
    data.report.days.filter((day) => day.workouts > 0).map((day) => day.date),
  );
  const months: string[] = [];
  for (let day = start; day <= data.report.to; day = addDays(day, 1)) {
    const month = day.slice(0, 7);
    if (!months.includes(month)) months.push(month);
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl font-normal">
              Votre régularité
            </CardTitle>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {dateLabel(start)} — {dateLabel(data.report.to)}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span>
              <strong className="mr-1 text-lg font-normal tabular-nums text-foreground">
                {trained.size}
              </strong>{" "}
              jours actifs
            </span>
            <span>
              <strong className="mr-1 text-lg font-normal tabular-nums text-foreground">
                {numberLabel(data.report.summary.averageWorkoutsPerWeek, 1)}
              </strong>{" "}
              séances / semaine
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="gap-4">
        <div
          className={cn(
            "grid gap-3",
            months.length > 1 && "sm:grid-cols-2",
            months.length > 4
              ? "xl:grid-cols-3"
              : months.length > 2 && "xl:grid-cols-4",
          )}
        >
          {months.map((month) => {
            const first = `${month}-01`;
            const [year, monthNumber] = month.split("-").map(Number);
            const dayCount = new Date(
              Date.UTC(year, monthNumber, 0),
            ).getUTCDate();
            const leading =
              (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
            const activeDays = [...trained].filter((day) =>
              day.startsWith(month),
            ).length;
            return (
              <div
                key={month}
                className="rounded-lg border border-border/70 bg-background/30 p-3"
              >
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-1">
                  <h3 className="text-sm capitalize">
                    {dateLabel(first, { month: "long" })}
                  </h3>
                  <span className="text-[10px] text-muted-foreground">
                    {activeDays} jours actifs
                  </span>
                </div>
                <div
                  role="group"
                  aria-label={dateLabel(first, {
                    month: "long",
                    year: "numeric",
                  })}
                  className="grid grid-cols-7 gap-1"
                >
                  {["L", "M", "M", "J", "V", "S", "D"].map((day, index) => (
                    <span
                      key={`label-${index}`}
                      aria-hidden="true"
                      className="mb-1 text-center text-[9px] text-muted-foreground"
                    >
                      {day}
                    </span>
                  ))}
                  {Array.from({ length: 42 }, (_, index) => {
                    const number = index - leading + 1;
                    if (number < 1 || number > dayCount)
                      return (
                        <span key={index} aria-hidden="true" className="h-7" />
                      );
                    const date = `${month}-${String(number).padStart(2, "0")}`;
                    const inPeriod = date >= start && date <= data.report.to;
                    const active = inPeriod && trained.has(date);
                    return (
                      <span
                        key={index}
                        title={`${dateLabel(date, { day: "numeric", month: "long" })} · ${!inPeriod ? "Hors période" : active ? "Entraînement" : "Sans séance"}`}
                        className={cn(
                          "flex h-7 items-center justify-center rounded-md text-[11px] tabular-nums",
                          !inPeriod
                            ? "text-muted-foreground/25"
                            : active
                              ? "bg-primary/20 text-[#efaaa0] ring-1 ring-inset ring-primary/25"
                              : "text-muted-foreground",
                          date === data.report.to &&
                            "outline outline-primary/60",
                        )}
                      >
                        {number}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <p className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="size-2.5 rounded-sm border border-primary/30 bg-primary/20" />
          Jours avec une séance enregistrée
        </p>
      </CardContent>
    </Card>
  );
}

function ExerciseTable({
  data,
  selectedId,
  onSelect,
}: {
  data: StatisticsPageData;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle className="text-xl font-normal">
          Tous vos exercices
        </CardTitle>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Choisissez un exercice pour afficher sa courbe au-dessus.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercice</TableHead>
              <TableHead className="text-right">Séries</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">Meilleur poids</TableHead>
              <TableHead className="text-right">1RM estimé</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.exercises.map((exercise) => {
              const progress = data.report.exercises.find(
                (entry) => entry.exerciseId === exercise.id,
              );
              const best = progress?.maxWeightKg ?? null;
              return (
                <TableRow
                  key={exercise.id}
                  data-state={
                    selectedId === exercise.id ? "selected" : undefined
                  }
                >
                  <TableCell className="py-3">
                    <button
                      type="button"
                      onClick={() => onSelect(exercise.id)}
                      aria-pressed={selectedId === exercise.id}
                      className="flex items-center gap-2 text-left hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <Dumbbell
                        aria-hidden="true"
                        className={cn(
                          "size-3.5",
                          selectedId === exercise.id
                            ? "text-primary"
                            : "text-muted-foreground",
                        )}
                      />
                      <span>{exercise.name}</span>
                    </button>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {progress?.sets || "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {progress
                      ? `${numberLabel(progress.volumeKg / 1000, 1)} t`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {best !== null ? `${numberLabel(best, 2)} kg` : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {progress?.bestEstimated1RmKg != null
                      ? `${numberLabel(progress.bestEstimated1RmKg, 2)} kg`
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Meilleurs résultats sur la période sélectionnée.
        </p>
      </CardContent>
    </Card>
  );
}

function usePeriod(path: string) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return {
    pending,
    change: (period: StatisticsPeriod) =>
      startTransition(() =>
        router.replace(`${path}?period=${period}`, { scroll: false }),
      ),
  };
}

export function StatisticsDashboard({ data }: { data: StatisticsPageData }) {
  const { pending, change } = usePeriod("/dashboard");
  const [exerciseId] = useSelectedExercise(
    data.userId,
    data.exercises,
    initialExercise(data),
  );
  return (
    <section className="space-y-6 sm:space-y-7" aria-busy={pending}>
      <PageHeader
        title={`Bonjour, ${data.userName.split(" ")[0]}`}
        description="Votre entraînement, en perspective."
      >
        <Button
          nativeButton={false}
          render={<Link href="/workouts?create=1" />}
        >
          <Plus aria-hidden="true" />
          Nouvelle séance
        </Button>
      </PageHeader>
      <div className="flex justify-end">
        <PeriodPicker period={data.period} onChange={change} />
      </div>
      <StatisticsNumbers data={data} />
      <div className="grid items-stretch gap-5 xl:grid-cols-[1fr_1.15fr]">
        <WeekCalendar data={data} />
        <ExerciseChart exerciseId={exerciseId} data={data} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <ActivityChart data={data} />
        <MuscleChart data={data} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <RecentWorkouts data={data} />
        <Records data={data} />
      </div>
    </section>
  );
}

export function StatisticsProgress({ data }: { data: StatisticsPageData }) {
  const { pending, change } = usePeriod("/progress");
  const [exerciseId, selectExercise] = useSelectedExercise(
    data.userId,
    data.exercises,
    initialExercise(data),
  );
  return (
    <section className="space-y-6 sm:space-y-7" aria-busy={pending}>
      <PageHeader
        title="Progression"
        description="Vos efforts prennent forme, séance après séance."
      >
        <PeriodPicker period={data.period} onChange={change} />
      </PageHeader>
      <StatisticsNumbers data={data} />
      <ExerciseChart
        exerciseId={exerciseId}
        onExerciseChange={selectExercise}
        data={data}
        detailed
      />
      <Consistency data={data} />
      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <ActivityChart data={data} />
        <MuscleChart data={data} />
      </div>
      <ExerciseTable
        data={data}
        selectedId={exerciseId}
        onSelect={selectExercise}
      />
      <Records data={data} />
    </section>
  );
}
