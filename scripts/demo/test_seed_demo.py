import unittest
from datetime import date

from seed_demo import EXERCISES, MARKER, seed, workout_payloads


class FakeApi:
    def __init__(self):
        self.token = None
        self.exercises = [{"id": "owned-exercise", "title": "Développé couché", "description": "My exercise"}]
        self.plans = []
        self.workouts = []
        self.created = []

    def call(self, service, method, path, body=None, allowed=()):
        if service == "account":
            if path == "/auth/register":
                assert allowed == (409,)
                return None
            if path == "/auth/login":
                return {"accessToken": "test-token"}
            return {"id": "demo-user", "username": "nero_demo", "role": "standard"}
        assert self.token == "test-token"
        if path == "/muscle-groups":
            return [{"id": code, "code": code} for code in {c for e in EXERCISES for c in e[3]}]
        if path.startswith("/exercises?"):
            return {"data": self.exercises, "meta": {"hasNextPage": False}}
        target = {"/exercises": self.exercises, "/plans": self.plans, "/workouts": self.workouts}[path]
        if method == "GET":
            return list(target)
        assert method == "POST"  # Fixtures never delete or overwrite existing resources.
        value = {**body, "id": str(len(self.created))}
        target.append(value)
        self.created.append((path, value))
        return value


class DemoFixtureTests(unittest.TestCase):
    def test_rerun_is_idempotent_and_keeps_unrelated_data(self):
        api = FakeApi()
        first = seed(api, date(2026, 10, 21))
        self.assertEqual(first["exercises"], 15)
        self.assertEqual(first["plans"], 3)
        self.assertGreater(first["workoutsCreated"], 60)
        count = len(api.created)
        second = seed(api, date(2026, 10, 21))
        self.assertEqual(second["workoutsCreated"], 0)
        self.assertEqual(len(api.created), count)
        self.assertEqual(api.exercises[0]["description"], "My exercise")
        self.assertEqual(len([e for e in api.exercises if e.get("description") == MARKER]), 15)
        for exercise in api.exercises[1:]:
            self.assertEqual(exercise["visibility"], "private")
        fixture_ids = {e["id"] for e in api.exercises[1:]}
        for resource in api.workouts + api.plans:
            self.assertTrue(all(e["exerciseId"] in fixture_ids for e in resource["exercises"]))

    def test_generated_dates_and_loads_are_valid_and_reproducible(self):
        ids = {e[0]: e[0] for e in EXERCISES}
        today = date(2026, 10, 21)
        workouts = list(workout_payloads(today, ids))
        self.assertEqual(workouts, list(workout_payloads(today, ids)))
        self.assertTrue(all(date.fromisoformat(w["workoutDate"]) <= today for w in workouts))
        self.assertTrue(any(w["durationMinutes"] is None for w in workouts))
        for workout in workouts:
            for exercise in workout["exercises"]:
                for set_ in exercise["sets"]:
                    self.assertGreaterEqual(set_["weightKg"], 0)
                    self.assertGreater(set_["reps"], 0)


if __name__ == "__main__":
    unittest.main()
