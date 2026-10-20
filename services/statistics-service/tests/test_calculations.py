from datetime import date
from decimal import Decimal

import pytest

from statistics_service.calculations import (
    compute_overview,
    compute_progression,
    compute_strength_curve,
    estimated_one_rep_max,
    month_bounds,
    overview_range,
    percent_change,
    week_bounds,
)
from statistics_service.models import WorkoutSet
from tests.factories import BENCH, PULL_UP, SQUAT, bench, pull_up, squat, workout


class TestSetFormulas:
    def test_epley_estimated_one_rep_max(self):
        assert estimated_one_rep_max(WorkoutSet(weight_kg=Decimal("100"), reps=5)) == Decimal("100") * (
            1 + Decimal(5) / 30
        )

    @pytest.mark.parametrize(("weight", "reps"), [("0", 12), ("80", 0)])
    def test_no_one_rep_max_without_load_or_reps(self, weight, reps):
        assert estimated_one_rep_max(WorkoutSet(weight_kg=Decimal(weight), reps=reps)) is None

    def test_percent_change(self):
        assert percent_change(12, 10) == 20.0
        assert percent_change(Decimal("900"), Decimal("1000")) == -10.0

    def test_percent_change_is_undefined_without_previous_value(self):
        assert percent_change(5, 0) is None


class TestCalendar:
    @pytest.mark.parametrize(
        ("month", "last_day"),
        [("2026-02-01", "2026-02-28"), ("2028-02-01", "2028-02-29"), ("2026-12-01", "2026-12-31")],
    )
    def test_month_bounds(self, month, last_day):
        assert month_bounds(date.fromisoformat(month)) == (date.fromisoformat(month), date.fromisoformat(last_day))

    def test_weeks_start_on_monday(self):
        # 2026-10-21 is a Wednesday
        assert week_bounds(date(2026, 10, 21)) == (date(2026, 10, 19), date(2026, 10, 25))

    def test_overview_range_covers_previous_month_and_current_week(self):
        # Week of 2026-11-02 (Monday) ... 2026-11-08 ends after October
        assert overview_range(date(2026, 10, 1), today=date(2026, 11, 3)) == (date(2026, 9, 1), date(2026, 11, 8))


class TestOverview:
    def test_month_totals(self):
        workouts = [
            workout("2026-10-02", squat((100, 5), (100, 5)), duration=50),
            workout("2026-10-02", bench((80, 8)), duration=None),
            workout("2026-10-15", pull_up((0, 10)), duration=30),
            workout("2026-11-01", squat((200, 1))),  # outside the month
        ]

        month = compute_overview(workouts, date(2026, 10, 1), today=date(2026, 10, 21)).month

        assert month.month == "2026-10"
        assert month.workouts == 3
        assert month.active_days == 2
        assert month.duration_minutes == 80
        assert month.volume_kg == 1640.0  # 2 x 500 + 640, pull-ups at bodyweight add nothing
        assert month.sets == 4
        assert month.reps == 28

    def test_comparison_with_previous_month(self):
        workouts = [
            workout("2026-09-10", squat((100, 10))),
            workout("2026-10-10", squat((100, 10))),
            workout("2026-10-12", squat((100, 5))),
        ]

        comparison = compute_overview(workouts, date(2026, 10, 1), today=date(2026, 10, 21)).month.vs_previous_month

        assert comparison.workouts == 100.0
        assert comparison.volume_kg == 50.0

    def test_no_comparison_when_previous_month_is_empty(self):
        workouts = [workout("2026-10-10", squat((100, 10)))]

        comparison = compute_overview(workouts, date(2026, 10, 1), today=date(2026, 10, 21)).month.vs_previous_month

        assert comparison.workouts is None
        assert comparison.volume_kg is None

    def test_current_week_lists_monday_to_sunday(self):
        workouts = [workout("2026-10-19", squat((100, 5))), workout("2026-10-21", pull_up((0, 10)))]

        week = compute_overview(workouts, date(2026, 10, 1), today=date(2026, 10, 21)).current_week

        assert [d.date for d in week] == [date(2026, 10, day) for day in range(19, 26)]
        assert [d.trained for d in week] == [True, False, True, False, False, False, False]
        assert week[0].volume_kg == 500.0
        assert week[2].volume_kg == 0.0

    def test_empty_history(self):
        overview = compute_overview([], date(2026, 10, 1), today=date(2026, 10, 21))

        assert overview.month.workouts == 0
        assert overview.month.volume_kg == 0.0
        assert not any(d.trained for d in overview.current_week)


class TestStrengthCurve:
    def test_one_point_per_session_with_best_values(self):
        workouts = [
            workout("2026-10-01", squat((100, 5), (90, 10))),
            workout("2026-10-08", squat((110, 3)), bench((80, 8))),
        ]

        curve = compute_strength_curve(workouts, SQUAT)

        assert curve.exercise_name == "Squat"
        assert [(p.date, p.max_weight_kg) for p in curve.points] == [
            (date(2026, 10, 1), 100.0),
            (date(2026, 10, 8), 110.0),
        ]
        # 90 x 10 (120 kg) beats 100 x 5 (116.67 kg) on the first session
        assert curve.points[0].estimated_1rm_kg == 120.0

    def test_sessions_on_the_same_day_are_merged(self):
        workouts = [workout("2026-10-01", squat((100, 5))), workout("2026-10-01", squat((120, 1)))]

        curve = compute_strength_curve(workouts, SQUAT)

        assert len(curve.points) == 1
        assert curve.points[0].max_weight_kg == 120.0

    def test_bodyweight_sets_are_ignored(self):
        curve = compute_strength_curve([workout("2026-10-01", pull_up((0, 10)))], PULL_UP)

        assert curve.exercise_name == "Pull-up"
        assert curve.points == []

    def test_unknown_exercise(self):
        curve = compute_strength_curve([workout("2026-10-01", squat((100, 5)))], BENCH)

        assert curve.exercise_name is None
        assert curve.points == []


class TestProgression:
    def test_summary(self):
        workouts = [
            workout("2026-10-01", squat((100, 5)), duration=60),
            workout("2026-10-08", squat((100, 5)), duration=None),
            workout("2026-10-14", squat((100, 5)), duration=40),
        ]

        summary = compute_progression(workouts).summary

        assert summary.workouts == 3
        assert summary.volume_kg == 1500.0
        assert summary.average_duration_minutes == 50.0
        assert summary.first_workout_date == date(2026, 10, 1)
        assert summary.average_workouts_per_week == 1.5  # 3 workouts over 2 weeks (Oct 1 -> Oct 14)

    def test_exercises_sorted_by_name_with_their_best_values(self):
        workouts = [
            workout("2026-10-01", squat((100, 5)), bench((70, 10))),
            workout("2026-10-08", squat((110, 2), (90, 12))),
        ]

        exercises = compute_progression(workouts).exercises

        assert [e.exercise_name for e in exercises] == ["Bench press", "Squat"]
        squat_progress = exercises[1]
        assert squat_progress.sets == 3
        assert squat_progress.volume_kg == 500.0 + 220.0 + 1080.0
        assert squat_progress.max_weight_kg == 110.0
        assert squat_progress.max_weight_date == date(2026, 10, 8)
        assert squat_progress.best_estimated_1rm_kg == 126.0  # 90 x 12

    def test_bodyweight_exercise_has_no_max_weight(self):
        progress = compute_progression([workout("2026-10-01", pull_up((0, 10)))]).exercises[0]

        assert progress.max_weight_kg is None
        assert progress.best_estimated_1rm_kg is None
        assert progress.sets == 1

    def test_volume_counts_for_every_targeted_muscle_group(self):
        workouts = [workout("2026-10-01", squat((100, 5)), bench((50, 2)))]

        muscles = {m.muscle_group: (m.sets, m.volume_kg) for m in compute_progression(workouts).muscle_groups}

        assert muscles == {"quads": (1, 500.0), "glutes": (1, 500.0), "chest": (1, 100.0), "triceps": (1, 100.0)}

    def test_records_are_improvements_over_the_previous_max_newest_first(self):
        workouts = [
            workout("2026-10-15", squat((105, 3))),  # unordered on purpose
            workout("2026-10-01", squat((100, 5))),
            workout("2026-10-08", squat((100, 6))),  # same weight: not a record
            workout("2026-10-22", squat((120, 1))),
        ]

        records = compute_progression(workouts).records

        assert [(r.date, r.weight_kg, r.previous_weight_kg) for r in records] == [
            (date(2026, 10, 22), 120.0, 105.0),
            (date(2026, 10, 15), 105.0, 100.0),
        ]

    def test_empty_history(self):
        progression = compute_progression([])

        assert progression.summary.workouts == 0
        assert progression.summary.first_workout_date is None
        assert progression.summary.average_workouts_per_week == 0.0
        assert progression.exercises == []
        assert progression.records == []
