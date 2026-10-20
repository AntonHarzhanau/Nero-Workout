"""Use cases: fetch the user's workouts, reuse the cached result if they did not change, otherwise compute."""

import hashlib
from collections.abc import Callable
from datetime import date
from typing import Any
from uuid import UUID

from pydantic import BaseModel

from . import calculations
from .cache import CacheEntry, StatsCache
from .models import Workout
from .workout_client import WorkoutClient, parse_workouts


class StatisticsService:
    def __init__(self, workouts: WorkoutClient, cache: StatsCache):
        self._workouts = workouts
        self._cache = cache

    async def overview(self, user_id: UUID, month_start: date, today: date) -> dict[str, Any]:
        start, end = calculations.overview_range(month_start, today)
        return await self._compute(
            user_id,
            f"overview:{month_start:%Y-%m}:{today.isoformat()}",
            start,
            end,
            lambda workouts: calculations.compute_overview(workouts, month_start, today),
        )

    async def strength_curve(
        self, user_id: UUID, exercise_id: UUID, start: date | None, end: date | None
    ) -> dict[str, Any]:
        return await self._compute(
            user_id,
            f"strength-curve:{exercise_id}:{start}:{end}",
            start,
            end,
            lambda workouts: calculations.compute_strength_curve(workouts, exercise_id),
        )

    async def progression(self, user_id: UUID, start: date | None, end: date | None) -> dict[str, Any]:
        return await self._compute(
            user_id, f"progression:{start}:{end}", start, end, calculations.compute_progression
        )

    async def _compute(
        self,
        user_id: UUID,
        query: str,
        start: date | None,
        end: date | None,
        compute: Callable[[list[Workout]], BaseModel],
    ) -> dict[str, Any]:
        raw = await self._workouts.fetch_raw(user_id, start, end)
        fingerprint = hashlib.sha256(raw).hexdigest()
        key = f"stats:{user_id}:{query}"

        cached = await self._cache.get(key)
        if cached is not None and cached.fingerprint == fingerprint:
            return cached.result

        result = compute(parse_workouts(raw)).model_dump(mode="json", by_alias=True)
        await self._cache.set(key, CacheEntry(fingerprint, result))
        return result
