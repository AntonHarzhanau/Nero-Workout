"""Data received from workout-service and responses returned to the frontend (camelCase JSON)."""

from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, frozen=True)


# --- workout-service: GET /internal/users/{userId}/workouts ---


class WorkoutSet(CamelModel):
    weight_kg: Decimal
    reps: int


class WorkoutExercise(CamelModel):
    exercise_id: UUID
    exercise_name: str
    muscle_groups: list[str]
    sets: list[WorkoutSet]


class Workout(CamelModel):
    id: UUID
    workout_date: date
    duration_minutes: int | None
    exercises: list[WorkoutExercise]


# --- GET /stats/overview ---


class MonthComparison(CamelModel):
    """Change in percent compared with the previous month; null when the previous month is empty."""

    workouts: float | None
    volume_kg: float | None


class MonthStats(CamelModel):
    month: str
    workouts: int
    active_days: int
    duration_minutes: int
    volume_kg: float
    sets: int
    reps: int
    vs_previous_month: MonthComparison


class WeekDay(CamelModel):
    date: date
    trained: bool
    volume_kg: float


class OverviewResponse(CamelModel):
    month: MonthStats
    current_week: list[WeekDay]


# --- GET /stats/strength-curve ---


class StrengthPoint(CamelModel):
    date: date
    max_weight_kg: float
    estimated_1rm_kg: float = Field(alias="estimated1RmKg")


class StrengthCurveResponse(CamelModel):
    exercise_id: UUID
    exercise_name: str | None
    points: list[StrengthPoint]


# --- GET /stats/progression ---


class ProgressionSummary(CamelModel):
    workouts: int
    duration_minutes: int
    volume_kg: float
    sets: int
    reps: int
    average_duration_minutes: float | None
    average_workouts_per_week: float
    first_workout_date: date | None


class ExerciseProgress(CamelModel):
    exercise_id: UUID
    exercise_name: str
    sets: int
    volume_kg: float
    max_weight_kg: float | None
    max_weight_date: date | None
    best_estimated_1rm_kg: float | None = Field(alias="bestEstimated1RmKg")


class MuscleGroupVolume(CamelModel):
    """An exercise counts for every muscle group it targets: volumes do not add up to the total."""

    muscle_group: str
    sets: int
    volume_kg: float


class PersonalRecord(CamelModel):
    date: date
    exercise_id: UUID
    exercise_name: str
    weight_kg: float
    previous_weight_kg: float


class ProgressionResponse(CamelModel):
    summary: ProgressionSummary
    exercises: list[ExerciseProgress]
    muscle_groups: list[MuscleGroupVolume]
    records: list[PersonalRecord]


class ActivityPoint(CamelModel):
    date: date
    workouts: int
    sets: int
    reps: int
    volume_kg: float
    duration_minutes: int


class ExerciseOption(CamelModel):
    exercise_id: UUID
    exercise_name: str


class ReportResponse(ProgressionResponse):
    start: date = Field(alias="from")
    end: date = Field(alias="to")
    previous_summary: ProgressionSummary | None
    days: list[ActivityPoint]
    weeks: list[ActivityPoint]
    exercise_options: list[ExerciseOption]
