"""Create an isolated demo account through public APIs; reruns reuse fixture resources."""
import argparse
import json
import os
from datetime import date, datetime, timedelta
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

MARKER = "nero-demo-v1"
# Stable keys are fixture-local; service IDs always come from the APIs.
EXERCISES = [
    ("bench", "Développé couché", "Barre", ["chest", "triceps"], 55, 1.25),
    ("squat", "Squat", "Barre", ["quads", "glutes"], 70, 2.5),
    ("row", "Rowing barre", "Barre", ["upper_back", "lats", "biceps"], 40, 1.25),
    ("deadlift", "Soulevé de terre", "Barre", ["hamstrings", "glutes", "lower_back"], 85, 2.5),
    ("press", "Développé militaire", "Haltères", ["shoulders", "triceps"], 25, 0.625),
    ("pulldown", "Tirage vertical", "Poulie", ["lats", "biceps"], 35, 1.25),
    ("curl", "Curl haltères", "Haltères", ["biceps"], 10, 0.25),
    ("leg-curl", "Leg curl", "Machine", ["hamstrings"], 25, 0.625),
    ("lateral", "Élévations latérales", "Haltères", ["shoulders"], 5, 0.25),
    ("extension", "Extension des jambes", "Machine", ["quads"], 30, 1.25),
    ("calves", "Extension des mollets", "Machine", ["calves"], 40, 1.25),
    ("crunch", "Crunch au sol", "Poids du corps", ["abs"], 0, 0),
    ("adductors", "Adducteurs à la machine", "Machine", ["adductors"], 25, 1.25),
    ("hip-thrust", "Hip thrust", "Barre", ["glutes"], 50, 2.5),
    ("face-pull", "Face pull", "Poulie", ["upper_back", "shoulders"], 15, 0.625),
]
ROUTINES = [
    ("Haut du corps", ["bench", "row", "press", "curl", "crunch"]),
    ("Bas du corps", ["squat", "deadlift", "leg-curl", "calves"]),
    ("Full body", ["squat", "bench", "pulldown", "hip-thrust", "face-pull"]),
]


class Api:
    def __init__(self, account_url, workout_url):
        self.account_url = account_url.rstrip("/")
        self.workout_url = workout_url.rstrip("/")
        self.token = None

    def call(self, service, method, path, body=None, allowed=()):
        url = (self.account_url if service == "account" else self.workout_url) + path
        headers = {"Accept": "application/json"}
        if body is not None:
            headers["Content-Type"] = "application/json"
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        request = Request(url, data=json.dumps(body).encode() if body is not None else None, headers=headers, method=method)
        try:
            with urlopen(request, timeout=15) as response:
                raw = response.read()
                return json.loads(raw) if raw else None
        except HTTPError as error:
            if error.code in allowed:
                return None
            # Never log credentials or JWTs.
            raise RuntimeError(f"{method} {path} returned HTTP {error.code}: {error.read().decode()}") from error


def workout_payloads(as_of, ids):
    monday = as_of - timedelta(days=as_of.weekday(), weeks=23)
    definitions = {item[0]: item for item in EXERCISES}
    for week in range(24):
        for session, offset in enumerate((0, 2, 4)):
            day = monday + timedelta(weeks=week, days=offset)
            if day > as_of or (week % 7 == 3 and session == 2):
                continue
            title, keys = ROUTINES[session]
            exercises = []
            for key in keys:
                definition = definitions[key]
                weight = max(0, definition[4] + (week // 2) * definition[5] - (definition[5] * 2 if week % 8 == 5 else 0))
                weight = round(weight * 4) / 4
                exercises.append({"exerciseId": ids[key], "sets": [{"weightKg": weight, "reps": 8 + (week + session + index) % 3} for index in range(3)]})
            yield {"title": title, "description": MARKER, "workoutDate": day.isoformat(), "durationMinutes": None if week == 0 else 44 + (week * 3 + session * 7) % 23, "exercises": exercises}


def seed(api, as_of, *, email="demo@nero.local", password="NeroDemo2026!", username="nero_demo"):
    api.call("account", "POST", "/auth/register", {"name": "Camille Martin", "username": username, "email": email, "password": password}, allowed=(409,))
    tokens = api.call("account", "POST", "/auth/login", {"email": email, "password": password})
    api.token = tokens["accessToken"]
    user = api.call("account", "GET", "/users/me")
    if user["username"] != username or user["role"] != "standard":
        raise RuntimeError("The demo identity does not match the requested standard account.")
    groups = {group["code"]: group["id"] for group in api.call("workout", "GET", "/muscle-groups")}
    required = {code for definition in EXERCISES for code in definition[3]}
    if required - groups.keys():
        raise RuntimeError("Missing muscle catalog codes; start the updated workout-service first.")
    owned = []
    page = 1
    while True:
        result = api.call("workout", "GET", "/exercises?" + urlencode({"scope": "mine", "page": page, "limit": 100}))
        owned.extend(result["data"])
        if not result["meta"]["hasNextPage"]:
            break
        page += 1
    existing = {item["title"]: item for item in owned if item.get("description") == MARKER}
    ids = {}
    for key, title, equipment, codes, _, _ in EXERCISES:
        item = existing.get(title) or api.call("workout", "POST", "/exercises", {"title": title, "equipment": equipment, "description": MARKER, "visibility": "private", "muscleGroups": [groups[code] for code in codes]})
        ids[key] = item["id"]
    plans = api.call("workout", "GET", "/plans")
    first_sessions = list(workout_payloads(as_of, ids))[:3]
    for title, keys in ROUTINES:
        if any(plan["title"] == title and plan.get("description") == MARKER for plan in plans):
            continue
        template = next(session for session in first_sessions if session["title"] == title)
        api.call("workout", "POST", "/plans", {"title": title, "description": MARKER, "exercises": template["exercises"]})
    workouts = api.call("workout", "GET", "/workouts")
    known = {(item["workoutDate"], item["title"]) for item in workouts if item.get("description") == MARKER}
    created = 0
    for payload in workout_payloads(as_of, ids):
        if (payload["workoutDate"], payload["title"]) not in known:
            api.call("workout", "POST", "/workouts", payload)
            created += 1
    return {"email": email, "userId": user["id"], "exercises": len(ids), "plans": len(ROUTINES), "workoutsCreated": created}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--as-of", type=date.fromisoformat, default=datetime.now(ZoneInfo("Europe/Paris")).date())
    args = parser.parse_args()
    result = seed(Api(os.getenv("ACCOUNT_API_URL", "http://account-service:8080"), os.getenv("WORKOUT_API_URL", "http://workout-service:3001")), args.as_of,
                  email=os.getenv("DEMO_EMAIL", "demo@nero.local"), password=os.getenv("DEMO_PASSWORD", "NeroDemo2026!"), username=os.getenv("DEMO_USERNAME", "nero_demo"))
    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
