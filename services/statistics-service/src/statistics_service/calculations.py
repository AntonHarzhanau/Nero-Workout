from collections import defaultdict
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal
from uuid import UUID

from .models import (
    ExerciseProgress,
    MonthComparison,
    MonthStats,
    MuscleGroupVolume,
    OverviewResponse,
    PersonalRecord,
    ProgressionResponse,
    ProgressionSummary,
    StrengthCurveResponse,
    StrengthPoint,
    WeekDay,
    Workout,
    WorkoutSet,
)

ZERO = Decimal(0)

# --- Set level ---


def set_volume(workout_set: WorkoutSet) -> Decimal:
    return workout_set.weight_kg * workout_set.reps


def estimated_one_rep_max(workout_set: WorkoutSet) -> Decimal | None:
    if workout_set.weight_kg <= 0 or workout_set.reps <= 0:
        return None
    return workout_set.weight_kg * (1 + Decimal(workout_set.reps) / 30)


def is_loaded(workout_set: WorkoutSet) -> bool:
    return workout_set.weight_kg > 0 and workout_set.reps > 0


def to_kg(value: Decimal) -> float:
    return float(value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


# --- Calendar ---


def month_bounds(month_start: date) -> tuple[date, date]:
    next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    return month_start, next_month - timedelta(days=1)


def previous_month(month_start: date) -> date:
    return (month_start - timedelta(days=1)).replace(day=1)


def week_bounds(day: date) -> tuple[date, date]:
    monday = day - timedelta(days=day.weekday())
    return monday, monday + timedelta(days=6)


def overview_range(month_start: date, today: date) -> tuple[date, date]:
    """Period to fetch: previous month (for the comparison) up to the end of the month and of the current week."""
    _, month_end = month_bounds(month_start)
    week_start, week_end = week_bounds(today)
    return min(previous_month(month_start), week_start), max(month_end, week_end)


# --- Aggregation ---


@dataclass
class Totals:
    workouts: int = 0
    duration_minutes: int = 0
    volume: Decimal = ZERO
    sets: int = 0
    reps: int = 0

    def add(self, workout: Workout) -> None:
        self.workouts += 1
        self.duration_minutes += workout.duration_minutes or 0
        for exercise in workout.exercises:
            for workout_set in exercise.sets:
                self.volume += set_volume(workout_set)
                self.sets += 1
                self.reps += workout_set.reps


def totals_of(workouts: Iterable[Workout]) -> Totals:
    totals = Totals()
    for workout in workouts:
        totals.add(workout)
    return totals


def workout_volume(workout: Workout) -> Decimal:
    return sum((set_volume(s) for e in workout.exercises for s in e.sets), ZERO)


def percent_change(current: Decimal | int, previous: Decimal | int) -> float | None:
    if previous == 0:
        return None
    return round(float((Decimal(current) - Decimal(previous)) / Decimal(previous) * 100), 1)


def between(workouts: Iterable[Workout], start: date, end: date) -> list[Workout]:
    return [w for w in workouts if start <= w.workout_date <= end]


# --- Overview ---


def compute_overview(workouts: list[Workout], month_start: date, today: date) -> OverviewResponse:
    month = totals_of(between(workouts, *month_bounds(month_start)))
    previous = totals_of(between(workouts, *month_bounds(previous_month(month_start))))
    active_days = {w.workout_date for w in between(workouts, *month_bounds(month_start))}

    week_start, _ = week_bounds(today)
    volume_by_day: dict[date, Decimal] = defaultdict(lambda: ZERO)
    trained_days: set[date] = set()
    for workout in workouts:
        trained_days.add(workout.workout_date)
        volume_by_day[workout.workout_date] += workout_volume(workout)

    current_week = []
    for offset in range(7):
        day = week_start + timedelta(days=offset)
        current_week.append(WeekDay(date=day, trained=day in trained_days, volume_kg=to_kg(volume_by_day[day])))

    return OverviewResponse(
        month=MonthStats(
            month=month_start.strftime("%Y-%m"),
            workouts=month.workouts,
            active_days=len(active_days),
            duration_minutes=month.duration_minutes,
            volume_kg=to_kg(month.volume),
            sets=month.sets,
            reps=month.reps,
            vs_previous_month=MonthComparison(
                workouts=percent_change(month.workouts, previous.workouts),
                volume_kg=percent_change(month.volume, previous.volume),
            ),
        ),
        current_week=current_week,
    )


# --- Strength curve ---


def compute_strength_curve(workouts: list[Workout], exercise_id: UUID) -> StrengthCurveResponse:
    best_by_date: dict[date, tuple[Decimal, Decimal]] = {}
    exercise_name: str | None = None

    for workout in workouts:
        for exercise in workout.exercises:
            if exercise.exercise_id != exercise_id:
                continue
            exercise_name = exercise.exercise_name
            loaded = [s for s in exercise.sets if is_loaded(s)]
            if not loaded:
                continue

            max_weight = max(s.weight_kg for s in loaded)
            best_one_rep_max = max(estimated_one_rep_max(s) for s in loaded)
            if (known := best_by_date.get(workout.workout_date)) is not None:
                max_weight = max(max_weight, known[0])
                best_one_rep_max = max(best_one_rep_max, known[1])
            best_by_date[workout.workout_date] = (max_weight, best_one_rep_max)

    points = [
        StrengthPoint(date=day, max_weight_kg=to_kg(weight), estimated_1rm_kg=to_kg(one_rep_max))
        for day, (weight, one_rep_max) in sorted(best_by_date.items())
    ]
    return StrengthCurveResponse(exercise_id=exercise_id, exercise_name=exercise_name, points=points)


# --- Progression ---


@dataclass
class ExerciseAccumulator:
    name: str
    sets: int = 0
    volume: Decimal = ZERO
    max_weight: Decimal | None = None
    max_weight_date: date | None = None
    best_one_rep_max: Decimal | None = None


@dataclass
class MuscleAccumulator:
    sets: int = 0
    volume: Decimal = ZERO


def compute_progression(workouts: list[Workout]) -> ProgressionResponse:
    chronological = sorted(workouts, key=lambda w: w.workout_date)
    totals = totals_of(chronological)
    exercises: dict[UUID, ExerciseAccumulator] = {}
    muscles: dict[str, MuscleAccumulator] = defaultdict(MuscleAccumulator)
    records: list[PersonalRecord] = []

    for workout in chronological:
        for exercise in workout.exercises:
            accumulator = exercises.setdefault(exercise.exercise_id, ExerciseAccumulator(exercise.exercise_name))
            accumulator.name = exercise.exercise_name
            volume = sum((set_volume(s) for s in exercise.sets), ZERO)

            accumulator.sets += len(exercise.sets)
            accumulator.volume += volume
            for muscle_group in exercise.muscle_groups:
                muscles[muscle_group].sets += len(exercise.sets)
                muscles[muscle_group].volume += volume

            loaded = [s for s in exercise.sets if is_loaded(s)]
            if not loaded:
                continue

            session_max = max(s.weight_kg for s in loaded)
            if accumulator.max_weight is not None and session_max > accumulator.max_weight:
                records.append(
                    PersonalRecord(
                        date=workout.workout_date,
                        exercise_id=exercise.exercise_id,
                        exercise_name=exercise.exercise_name,
                        weight_kg=to_kg(session_max),
                        previous_weight_kg=to_kg(accumulator.max_weight),
                    )
                )
            if accumulator.max_weight is None or session_max > accumulator.max_weight:
                accumulator.max_weight = session_max
                accumulator.max_weight_date = workout.workout_date

            session_one_rep_max = max(estimated_one_rep_max(s) for s in loaded)
            if accumulator.best_one_rep_max is None or session_one_rep_max > accumulator.best_one_rep_max:
                accumulator.best_one_rep_max = session_one_rep_max

    return ProgressionResponse(
        summary=_summary(chronological, totals),
        exercises=sorted(
            (
                ExerciseProgress(
                    exercise_id=exercise_id,
                    exercise_name=a.name,
                    sets=a.sets,
                    volume_kg=to_kg(a.volume),
                    max_weight_kg=to_kg(a.max_weight) if a.max_weight is not None else None,
                    max_weight_date=a.max_weight_date,
                    best_estimated_1rm_kg=to_kg(a.best_one_rep_max) if a.best_one_rep_max is not None else None,
                )
                for exercise_id, a in exercises.items()
            ),
            key=lambda e: e.exercise_name.casefold(),
        ),
        muscle_groups=sorted(
            (MuscleGroupVolume(muscle_group=code, sets=m.sets, volume_kg=to_kg(m.volume)) for code, m in muscles.items()),
            key=lambda m: (-m.volume_kg, m.muscle_group),
        ),
        records=sorted(records, key=lambda r: r.date, reverse=True),
    )


def _summary(chronological: list[Workout], totals: Totals) -> ProgressionSummary:
    durations = [w.duration_minutes for w in chronological if w.duration_minutes is not None]
    if chronological:
        first, last = chronological[0].workout_date, chronological[-1].workout_date
        weeks = (last - first).days // 7 + 1
        per_week = round(len(chronological) / weeks, 2)
    else:
        first, per_week = None, 0.0

    return ProgressionSummary(
        workouts=totals.workouts,
        duration_minutes=totals.duration_minutes,
        volume_kg=to_kg(totals.volume),
        sets=totals.sets,
        reps=totals.reps,
        average_duration_minutes=round(sum(durations) / len(durations), 1) if durations else None,
        average_workouts_per_week=per_week,
        first_workout_date=first,
    )
