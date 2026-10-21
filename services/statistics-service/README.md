# Statistics service

FastAPI computes statistics from Workout's authenticated internal API. User identity
comes exclusively from the Account RS256 JWT. Redis caches computed results; every
request checks the current Workout response fingerprint before reusing a result.

## Dashboard report

`GET /stats/report?from=YYYY-MM-DD&to=YYYY-MM-DD` requires a user Bearer token.
Dates are inclusive; `to` defaults to today in `Europe/Paris` and is capped at today.
Without `from`, the report starts at the user's first workout (today for empty history).
An explicit range cannot exceed 36,600 days.

The camelCase response includes:

- `from`, `to`: effective calendar bounds;
- `summary`, `exercises`, `muscleGroups`: totals and per-exercise/group aggregates;
- `previousSummary`: immediately preceding interval of the same number of days,
  or `null` for all history;
- `days`: daily aggregates, including days without workouts;
- `weeks`: aggregates starting on Mondays, including empty and partial weeks;
- `records`: new maximum-weight records in the selection, compared with all earlier workouts;
- `exerciseOptions`: exercises from the user's full history through `to`.

Average weekly frequency uses the full selected interval, including inactive weeks.
An exercise's volume and set count apply to each recorded muscle group, so muscle
rows cannot be added together to obtain a total. Historical exercise names and muscle
codes come from Workout snapshots. Group labels are resolved against Workout's catalog
by the frontend. No database joins across services are required.

The existing `/health`, `/stats/overview`, `/stats/progression` and
`/stats/strength-curve?exerciseId=<uuid>&from=...&to=...` routes remain available.
Strength points are per day, use positive-weight/positive-repetition sets and the
Epley estimate `weight × (1 + reps / 30)`. Bodyweight-only sets still contribute to
report sets/reps, but do not produce a loaded-strength point.

## Tests

From the repository root:

```bash
docker build --target test -t nero-statistics-tests services/statistics-service
docker run --rm nero-statistics-tests
```

The `test` target includes mocked Workout data and in-memory Redis. The runtime
image excludes the tests and their development dependencies.
