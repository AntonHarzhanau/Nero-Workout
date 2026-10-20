"""Builders for the data returned by workout-service."""

from datetime import date
from decimal import Decimal
from uuid import UUID, uuid4

from statistics_service.models import Workout, WorkoutExercise, WorkoutSet

SQUAT = UUID("3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b")
BENCH = UUID("7d8e9f0a-1b2c-4d3e-9f4a-5b6c7d8e9f0a")
PULL_UP = UUID("1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d")


def sets(*pairs: tuple[str | int, int]) -> list[WorkoutSet]:
    """sets((100, 5), (90, 8)) -> two sets: 100 kg x 5, 90 kg x 8."""
    return [WorkoutSet(weight_kg=Decimal(str(weight)), reps=reps) for weight, reps in pairs]


def squat(*pairs: tuple[str | int, int]) -> WorkoutExercise:
    return WorkoutExercise(
        exercise_id=SQUAT, exercise_name="Squat", muscle_groups=["quads", "glutes"], sets=sets(*pairs)
    )


def bench(*pairs: tuple[str | int, int]) -> WorkoutExercise:
    return WorkoutExercise(
        exercise_id=BENCH, exercise_name="Bench press", muscle_groups=["chest", "triceps"], sets=sets(*pairs)
    )


def pull_up(*pairs: tuple[str | int, int]) -> WorkoutExercise:
    return WorkoutExercise(exercise_id=PULL_UP, exercise_name="Pull-up", muscle_groups=["lats"], sets=sets(*pairs))


def workout(day: str, *exercises: WorkoutExercise, duration: int | None = 60) -> Workout:
    return Workout(id=uuid4(), workout_date=date.fromisoformat(day), duration_minutes=duration, exercises=list(exercises))
