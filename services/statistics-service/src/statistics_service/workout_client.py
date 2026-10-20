"""Service-to-service calls to workout-service (internal network, X-Internal-Token)."""

import logging
from datetime import date
from uuid import UUID

import httpx
from pydantic import TypeAdapter, ValidationError

from .errors import workout_service_unavailable
from .models import Workout

logger = logging.getLogger(__name__)

_workouts = TypeAdapter(list[Workout])


class WorkoutClient:
    def __init__(self, http: httpx.AsyncClient, base_url: str, internal_token: str):
        self._http = http
        self._base_url = base_url.rstrip("/")
        self._internal_token = internal_token

    async def fetch_raw(self, user_id: UUID, start: date | None = None, end: date | None = None) -> bytes:
        """Raw JSON body: hashed by the cache before being parsed."""
        params = {key: value.isoformat() for key, value in (("from", start), ("to", end)) if value is not None}
        try:
            response = await self._http.get(
                f"{self._base_url}/internal/users/{user_id}/workouts",
                params=params,
                headers={"X-Internal-Token": self._internal_token, "Accept": "application/json"},
            )
        except httpx.HTTPError as exc:
            logger.error("workout-service unreachable: %s", exc)
            raise workout_service_unavailable() from exc

        if response.status_code != 200:
            logger.error("workout-service answered %s for user %s", response.status_code, user_id)
            raise workout_service_unavailable()

        return response.content


def parse_workouts(raw: bytes) -> list[Workout]:
    try:
        return _workouts.validate_json(raw)
    except ValidationError as exc:
        logger.error("Unexpected payload from workout-service: %s", exc)
        raise workout_service_unavailable() from exc
