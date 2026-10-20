import time
from collections.abc import Iterator
from datetime import date
from uuid import UUID

import fakeredis
import httpx
import jwt
import pytest
import respx
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from statistics_service.api import get_today
from statistics_service.cache import StatsCache
from statistics_service.config import get_settings
from statistics_service.main import create_app
from statistics_service.stats_service import StatisticsService
from statistics_service.workout_client import WorkoutClient

WORKOUT_URL = "http://workout-service:3001"
INTERNAL_TOKEN = "internal-test-token"
USER_ID = UUID("0b6f2c1e-7a3d-4e8b-9f21-5c4d3a2b1e0f")
TODAY = date(2026, 10, 21)


def _generate_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


@pytest.fixture(scope="session")
def private_key() -> rsa.RSAPrivateKey:
    return _generate_key()


@pytest.fixture(scope="session")
def other_private_key() -> rsa.RSAPrivateKey:
    return _generate_key()


@pytest.fixture(autouse=True)
def environment(tmp_path, monkeypatch, private_key) -> Iterator[None]:
    public_key = tmp_path / "jwt_public.pem"
    public_key.write_bytes(
        private_key.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo
        )
    )
    token_file = tmp_path / "internal_api_token"
    token_file.write_text(INTERNAL_TOKEN + "\n")

    monkeypatch.setenv("WORKOUT_SERVICE_URL", WORKOUT_URL)
    monkeypatch.setenv("INTERNAL_API_TOKEN_FILE", str(token_file))
    monkeypatch.setenv("JWT_PUBLIC_KEY", str(public_key))
    monkeypatch.delenv("REDIS_URL", raising=False)
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def make_token(private_key):
    """Signs an access token shaped like account-service's ones; any claim can be overridden."""

    def _make(key: rsa.RSAPrivateKey | None = None, algorithm: str = "RS256", **overrides) -> str:
        now = int(time.time())
        claims = {"sub": str(USER_ID), "role": "standard", "iss": "account-service", "aud": "nero", "iat": now, "exp": now + 900}
        claims.update(overrides)
        claims = {name: value for name, value in claims.items() if value is not None}
        return jwt.encode(claims, key or private_key, algorithm=algorithm)

    return _make


@pytest.fixture
def auth_headers(make_token) -> dict[str, str]:
    return {"Authorization": f"Bearer {make_token()}"}


@pytest.fixture
def workout_api() -> Iterator[respx.MockRouter]:
    with respx.mock(base_url=WORKOUT_URL, assert_all_called=False) as router:
        yield router


@pytest.fixture
def redis_server() -> fakeredis.FakeServer:
    return fakeredis.FakeServer()


@pytest.fixture
def client(redis_server) -> Iterator[TestClient]:
    app = create_app()
    app.dependency_overrides[get_today] = lambda: TODAY
    with TestClient(app) as test_client:
        # Same wiring as in production, with an in-memory Redis
        app.state.statistics = StatisticsService(
            WorkoutClient(httpx.AsyncClient(timeout=3), WORKOUT_URL, INTERNAL_TOKEN),
            StatsCache(fakeredis.FakeAsyncRedis(server=redis_server, decode_responses=True), ttl_seconds=60),
        )
        yield test_client
