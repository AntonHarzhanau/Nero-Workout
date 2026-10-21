"""Dashboard data computed from the user's history, with inclusive calendar periods."""

from datetime import date, timedelta

from .calculations import compute_progression, totals_of, to_kg, week_bounds
from .models import ActivityPoint, ExerciseOption, ReportResponse, Workout


def compute_report(history: list[Workout], start: date | None, end: date) -> ReportResponse:
    history = sorted((w for w in history if w.workout_date <= end), key=lambda w: (w.workout_date, str(w.id)))
    first = start or (history[0].workout_date if history else end)
    selected = [w for w in history if first <= w.workout_date <= end]
    current = compute_progression(selected)
    elapsed = (end - first).days + 1
    summary = current.summary.model_copy(update={"average_workouts_per_week": round(len(selected) * 7 / elapsed, 2)})
    # A real PR must beat every earlier session, including those outside the filter.
    lifetime = compute_progression(history)
    previous = None
    if start is not None:
        previous_workouts = [w for w in history if first - timedelta(days=min(elapsed, first.toordinal() - 1)) <= w.workout_date < first]
        previous = compute_progression(previous_workouts).summary.model_copy(
            update={"average_workouts_per_week": round(len(previous_workouts) * 7 / elapsed, 2)}
        )

    def activity(day: date, workouts: list[Workout]) -> ActivityPoint:
        totals = totals_of(workouts)
        return ActivityPoint(date=day, workouts=totals.workouts, sets=totals.sets, reps=totals.reps,
                             volume_kg=to_kg(totals.volume), duration_minutes=totals.duration_minutes)

    by_day: dict[date, list[Workout]] = {}
    by_week: dict[date, list[Workout]] = {}
    for workout in selected:
        by_day.setdefault(workout.workout_date, []).append(workout)
        by_week.setdefault(week_bounds(workout.workout_date)[0], []).append(workout)
    days = [activity(first + timedelta(days=offset), by_day.get(first + timedelta(days=offset), []))
            for offset in range(elapsed)]
    monday = week_bounds(first)[0]
    weeks = [activity(monday + timedelta(days=offset), by_week.get(monday + timedelta(days=offset), []))
             for offset in range(0, (end - monday).days + 1, 7)]
    return ReportResponse(
        **current.model_dump(exclude={"summary", "records"}),
        summary=summary, records=[r for r in lifetime.records if first <= r.date <= end],
        start=first, end=end, previous_summary=previous, days=days, weeks=weeks,
        exercise_options=[ExerciseOption(exercise_id=e.exercise_id, exercise_name=e.exercise_name) for e in lifetime.exercises],
    )
