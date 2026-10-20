from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI
from redis.asyncio import Redis

from .api import router
from .cache import StatsCache
from .config import get_settings
from .errors import register_error_handlers
from .stats_service import StatisticsService
from .workout_client import WorkoutClient


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    http = httpx.AsyncClient(timeout=settings.http_timeout_seconds)
    redis = (
        Redis.from_url(settings.redis_url, decode_responses=True, socket_timeout=0.5, socket_connect_timeout=0.5)
        if settings.redis_url
        else None
    )

    app.state.statistics = StatisticsService(
        WorkoutClient(http, settings.workout_service_url, settings.internal_api_token()),
        StatsCache(redis, settings.cache_ttl_seconds),
    )
    yield

    await http.aclose()
    if redis is not None:
        await redis.aclose()


def create_app() -> FastAPI:
    app = FastAPI(title="Nero statistics-service", lifespan=lifespan)
    register_error_handlers(app)
    app.include_router(router)
    return app


app = create_app()
