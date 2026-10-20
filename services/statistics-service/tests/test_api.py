import json

import httpx
import pytest

from statistics_service import calculations
from tests.conftest import INTERNAL_TOKEN, USER_ID
from tests.factories import SQUAT, squat, workout

WORKOUTS_PATH = f"/internal/users/{USER_ID}/workouts"


def workouts_json(*workouts) -> list[dict]:
    return [json.loads(w.model_dump_json(by_alias=True)) for w in workouts]


SAMPLE = workouts_json(
    workout("2026-10-01", squat((100, 5))),
    workout("2026-10-20", squat((110, 3))),
)


def test_health_needs_no_token(client):
    assert client.get("/health").json() == {"status": "ok"}


class TestAuthentication:
    @pytest.mark.parametrize("path", ["/stats/overview", "/stats/progression", f"/stats/strength-curve?exerciseId={SQUAT}"])
    def test_routes_require_a_token(self, client, path):
        response = client.get(path)

        assert response.status_code == 401
        assert response.json()["error"] == "missing_token"
        assert response.headers["www-authenticate"] == "Bearer"

    def test_invalid_token(self, client):
        response = client.get("/stats/overview", headers={"Authorization": "Bearer not.a.jwt"})

        assert response.status_code == 401
        assert response.json() == {"error": "invalid_token", "message": "The access token is invalid."}


class TestWorkoutServiceCall:
    def test_requests_the_user_workouts_with_the_internal_token(self, client, auth_headers, workout_api):
        route = workout_api.get(WORKOUTS_PATH).respond(json=SAMPLE)

        response = client.get("/stats/progression?from=2026-10-01&to=2026-10-31", headers=auth_headers)

        assert response.status_code == 200
        request = route.calls.last.request
        assert request.headers["X-Internal-Token"] == INTERNAL_TOKEN
        assert dict(request.url.params) == {"from": "2026-10-01", "to": "2026-10-31"}

    def test_overview_fetches_previous_month_and_current_week(self, client, auth_headers, workout_api):
        route = workout_api.get(WORKOUTS_PATH).respond(json=[])

        client.get("/stats/overview?month=2026-10", headers=auth_headers)

        assert dict(route.calls.last.request.url.params) == {"from": "2026-09-01", "to": "2026-10-31"}

    @pytest.mark.parametrize(
        "mock_response",
        [httpx.Response(500), httpx.Response(401), httpx.Response(200, json=[{"unexpected": True}]), httpx.ConnectError("refused")],
        ids=["server-error", "rejected-token", "unexpected-payload", "unreachable"],
    )
    def test_workout_service_failure_is_a_bad_gateway(self, client, auth_headers, workout_api, mock_response):
        workout_api.get(WORKOUTS_PATH).mock(side_effect=[mock_response])

        response = client.get("/stats/progression", headers=auth_headers)

        assert response.status_code == 502
        assert response.json()["error"] == "dependency_unavailable"


class TestRoutes:
    def test_overview(self, client, auth_headers, workout_api):
        workout_api.get(WORKOUTS_PATH).respond(json=SAMPLE)

        body = client.get("/stats/overview?month=2026-10", headers=auth_headers).json()

        assert body["month"]["month"] == "2026-10"
        assert body["month"]["workouts"] == 2
        assert body["month"]["volumeKg"] == 830.0
        assert body["month"]["vsPreviousMonth"] == {"workouts": None, "volumeKg": None}
        assert [day["trained"] for day in body["currentWeek"]] == [False, True, False, False, False, False, False]

    def test_overview_defaults_to_the_current_month(self, client, auth_headers, workout_api):
        workout_api.get(WORKOUTS_PATH).respond(json=[])

        body = client.get("/stats/overview", headers=auth_headers).json()

        assert body["month"]["month"] == "2026-10"

    def test_strength_curve(self, client, auth_headers, workout_api):
        workout_api.get(WORKOUTS_PATH).respond(json=SAMPLE)

        body = client.get(f"/stats/strength-curve?exerciseId={SQUAT}", headers=auth_headers).json()

        assert body["exerciseName"] == "Squat"
        assert [p["maxWeightKg"] for p in body["points"]] == [100.0, 110.0]
        assert "estimated1RmKg" in body["points"][0]

    def test_progression(self, client, auth_headers, workout_api):
        workout_api.get(WORKOUTS_PATH).respond(json=SAMPLE)

        body = client.get("/stats/progression", headers=auth_headers).json()

        assert body["summary"]["workouts"] == 2
        assert body["records"] == [
            {
                "date": "2026-10-20",
                "exerciseId": str(SQUAT),
                "exerciseName": "Squat",
                "weightKg": 110.0,
                "previousWeightKg": 100.0,
            }
        ]

    @pytest.mark.parametrize(
        "path",
        [
            "/stats/overview?month=2026-13",
            "/stats/overview?month=october",
            "/stats/strength-curve",
            "/stats/strength-curve?exerciseId=not-a-uuid",
            "/stats/progression?from=2026-10-31&to=2026-10-01",
            "/stats/progression?from=yesterday",
        ],
    )
    def test_invalid_parameters(self, client, auth_headers, path):
        response = client.get(path, headers=auth_headers)

        assert response.status_code == 422
        assert response.json()["error"] == "validation_failed"


class TestCache:
    @pytest.fixture
    def compute_calls(self, monkeypatch) -> list[int]:
        calls: list[int] = []
        real = calculations.compute_progression

        def counting(workouts):
            calls.append(1)
            return real(workouts)

        monkeypatch.setattr(calculations, "compute_progression", counting)
        return calls

    def test_unchanged_workouts_are_not_recomputed(self, client, auth_headers, workout_api, compute_calls):
        workout_api.get(WORKOUTS_PATH).respond(json=SAMPLE)

        first = client.get("/stats/progression", headers=auth_headers).json()
        second = client.get("/stats/progression", headers=auth_headers).json()

        assert first == second
        assert len(compute_calls) == 1

    def test_changed_workouts_are_recomputed(self, client, auth_headers, workout_api, compute_calls):
        route = workout_api.get(WORKOUTS_PATH)
        route.respond(json=SAMPLE)
        client.get("/stats/progression", headers=auth_headers)

        route.respond(json=SAMPLE + workouts_json(workout("2026-10-21", squat((120, 1)))))
        body = client.get("/stats/progression", headers=auth_headers).json()

        assert len(compute_calls) == 2
        assert body["summary"]["workouts"] == 3

    def test_redis_outage_does_not_break_requests(self, client, auth_headers, workout_api, redis_server, compute_calls):
        workout_api.get(WORKOUTS_PATH).respond(json=SAMPLE)
        redis_server.connected = False

        responses = [client.get("/stats/progression", headers=auth_headers) for _ in range(2)]

        assert [r.status_code for r in responses] == [200, 200]
        assert len(compute_calls) == 2  # computed every time, without cache
