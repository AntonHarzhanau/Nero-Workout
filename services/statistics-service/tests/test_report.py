from datetime import date

from statistics_service.report import compute_report
from tests.factories import BENCH, SQUAT, bench, squat, workout
from tests.test_api import WORKOUTS_PATH, workouts_json


def test_report_includes_idle_days_and_weeks_and_uses_whole_period():
    report = compute_report([workout("2026-10-15", squat((100, 5)))], date(2026, 10, 1), date(2026, 10, 21))
    assert report.summary.workouts == 1
    assert report.summary.average_workouts_per_week == 0.33
    assert len(report.days) == 21
    assert report.days[0].workouts == 0
    assert report.days[14].volume_kg == 500
    assert [point.date for point in report.weeks] == [date(2026, 9, 28), date(2026, 10, 5), date(2026, 10, 12), date(2026, 10, 19)]
    assert [point.workouts for point in report.weeks] == [0, 0, 1, 0]


def test_record_must_beat_history_before_selected_period():
    history = [workout("2026-09-01", squat((100, 5))), workout("2026-10-01", squat((80, 5))), workout("2026-10-08", squat((90, 5)))]
    report = compute_report(history, date(2026, 10, 1), date(2026, 10, 21))
    assert report.records == []
    history.append(workout("2026-10-15", squat((110, 3))))
    report = compute_report(history, date(2026, 10, 1), date(2026, 10, 21))
    assert len(report.records) == 1
    assert report.records[0].previous_weight_kg == 100
    assert report.records[0].weight_kg == 110


def test_previous_summary_covers_equal_length_immediately_before_selection():
    report = compute_report([
        workout("2026-09-09", squat((200, 5))),  # outside previous 21 days
        workout("2026-09-10", squat((100, 5))),
        workout("2026-09-30", bench((50, 10))),
        workout("2026-10-01", squat((110, 5))),
    ], date(2026, 10, 1), date(2026, 10, 21))
    assert report.previous_summary.workouts == 2
    assert report.previous_summary.volume_kg == 1000
    assert report.previous_summary.average_workouts_per_week == 0.67
    assert report.summary.workouts == 1


def test_multiple_workouts_same_day_are_aggregated_and_options_include_older_exercises():
    report = compute_report([
        workout("2026-09-01", bench((50, 8))),
        workout("2026-10-01", squat((100, 5)), duration=None),
        workout("2026-10-01", squat((120, 1)), duration=30),
        workout("2026-10-22", bench((200, 1))),
    ], date(2026, 10, 1), date(2026, 10, 21))
    assert report.days[0].workouts == 2
    assert report.days[0].volume_kg == 620
    assert report.days[0].sets == 2
    assert report.days[0].duration_minutes == 30
    assert {option.exercise_id for option in report.exercise_options} == {SQUAT, BENCH}
    assert report.summary.workouts == 2


def test_empty_and_all_history_reports():
    empty = compute_report([], None, date(2026, 10, 21))
    assert empty.start == empty.end == date(2026, 10, 21)
    assert empty.previous_summary is None
    assert empty.summary.workouts == 0
    assert empty.exercise_options == []
    assert len(empty.days) == 1
    history = compute_report([workout("2026-09-01", squat((100, 5)))], None, date(2026, 10, 21))
    assert history.start == date(2026, 9, 1)
    assert history.summary.first_workout_date == date(2026, 9, 1)


def test_report_route_authentication_validation_and_historical_fetch(client, auth_headers, workout_api):
    assert client.get("/stats/report").status_code == 401
    assert client.get("/stats/report?from=invalid", headers=auth_headers).status_code == 422
    assert client.get("/stats/report?from=2026-10-22", headers=auth_headers).status_code == 422
    assert client.get("/stats/report?from=1000-01-01", headers=auth_headers).status_code == 422
    route = workout_api.get(WORKOUTS_PATH).respond(json=workouts_json(workout("2026-09-01", squat((100, 5))), workout("2026-10-01", squat((90, 5)))))
    response = client.get("/stats/report?from=2026-10-01&to=2026-12-31", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["from"] == "2026-10-01"
    assert body["to"] == "2026-10-21"
    assert body["records"] == []
    assert body["summary"]["workouts"] == 1
    assert body["days"][0]["volumeKg"] == 450
    assert dict(route.calls.last.request.url.params) == {"to": "2026-10-21"}
    assert "from" not in route.calls.last.request.url.params


def test_report_recomputes_when_earlier_history_changes(client, auth_headers, workout_api):
    route = workout_api.get(WORKOUTS_PATH).respond(json=workouts_json(workout("2026-09-01", squat((80, 5))), workout("2026-10-01", squat((90, 5)))))
    first = client.get("/stats/report?from=2026-10-01", headers=auth_headers).json()
    assert len(first["records"]) == 1
    route.respond(json=workouts_json(workout("2026-09-01", squat((100, 5))), workout("2026-10-01", squat((90, 5)))))
    second = client.get("/stats/report?from=2026-10-01", headers=auth_headers).json()
    assert second["records"] == []
