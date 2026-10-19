# Internal Statistics API

```http
GET http://workout-service:3001/internal/users/{userId}/workouts?from=2026-10-01&to=2026-10-31
X-Internal-Token: <contents of /run/nero/internal/internal_api_token>
Accept: application/json
```

Statistics must join the Compose `backend` network and mount the shared
`internal_token` volume read-only at `/run/nero/internal`. Read and trim the token
file before sending the header. A user JWT does not grant access to this API.

## Response

```json
[
  {
    "id": "8c2e4f6a-1b3d-4e5f-a7b9-c1d2e3f4a5b6",
    "workoutDate": "2026-10-15",
    "durationMinutes": 65,
    "exercises": [
      {
        "exerciseId": "3f1a2b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b",
        "exerciseName": "Squat",
        "muscleGroups": ["glutes", "quads"],
        "sets": [
          { "weightKg": "100.00", "reps": 5 },
          { "weightKg": "0.00", "reps": 12 }
        ]
      }
    ]
  }
]
```

- `from` and `to` are independently optional, inclusive calendar dates in
  `YYYY-MM-DD` format. Without either bound, all workouts are returned.
- Workouts are ordered by `workoutDate ASC`, then `id ASC` for ties. There is no
  pagination. Exercises and sets follow their recorded positions.
- An unknown user UUID, a user without workouts, or a range without matches
  returns `200` with `[]`. This endpoint does not look up accounts.
- `durationMinutes` can be `null` or `0`. `weightKg` is a decimal string with two
  fractional digits. Empty exercises, muscle groups and sets are valid arrays.
- `muscleGroups` contains all recorded muscle group **codes**, sorted ascending.
- Missing or invalid `X-Internal-Token` returns `401`. Invalid UUIDs, invalid
  dates, a reversed date range and unsupported query parameters return `400`.

## Snapshots

Workout writes capture the catalog title and muscle group codes in
`workouts.workout_exercises.exercise_name_snapshot` and
`workouts.workout_exercises.muscle_groups_snapshot`.
Clients cannot supply or override these values.

Creation, incremental addition and full replacement (`PUT /workouts/:id`)
capture current catalog values. A full replacement records new inclusions and
therefore new snapshots. Later catalog edits do not change stored snapshots.
Public workout detail responses continue to use current catalog data.

The migration backfills existing inclusions from the current catalog because
older historical values are unavailable. The existing catalog deletion cascade
still applies: deleting an exercise removes its workout inclusions and sets.

## Validation

Run from `services/workout-service`:

```bash
npm test
npm run test:mutation:statistics
```

The mutation configuration covers the export, its HTTP validation and internal
authentication, and the workout write paths. It includes static mutations and
requires a 100% score. The HTML report is `reports/mutation/statistics.html`.

For PostgreSQL integration tests, use a disposable database named exactly
`workouts_module_test`; the suite truncates its fixtures:

```bash
WORKOUT_TEST_DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/workouts_module_test npm run test:e2e -- test/workouts.e2e-spec.ts
```

These tests exercise inclusive SQL filtering, owner isolation, ordering, snapshot
capture, migration backfill and rollback, and verify that the migrated schema
matches TypeORM metadata. The new migration must run before deploying the updated
Workout service; Compose already runs migrations before starting it.
