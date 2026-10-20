import json
import logging
from dataclasses import dataclass
from typing import Any

from redis.asyncio import Redis
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class CacheEntry:
    fingerprint: str
    result: dict[str, Any]


class StatsCache:
    def __init__(self, redis: Redis | None, ttl_seconds: int):
        self._redis = redis
        self._ttl = ttl_seconds

    async def get(self, key: str) -> CacheEntry | None:
        if self._redis is None:
            return None
        try:
            raw = await self._redis.get(key)
        except RedisError as exc:
            logger.warning("Cache read failed, computing without cache: %s", exc)
            return None
        if raw is None:
            return None
        data = json.loads(raw)
        return CacheEntry(fingerprint=data["fingerprint"], result=data["result"])

    async def set(self, key: str, entry: CacheEntry) -> None:
        if self._redis is None:
            return
        try:
            await self._redis.set(key, json.dumps({"fingerprint": entry.fingerprint, "result": entry.result}), ex=self._ttl)
        except RedisError as exc:
            logger.warning("Cache write failed: %s", exc)
