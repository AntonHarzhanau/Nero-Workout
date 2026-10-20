from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Read from environment variables (same names as the other services in compose.yaml)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    workout_service_url: str
    internal_api_token_file: Path
    jwt_public_key: Path
    jwt_issuer: str = "account-service"
    jwt_audience: str = "nero"

    redis_url: str | None = None
    cache_ttl_seconds: int = 24 * 3600

    http_timeout_seconds: float = 3.0
    timezone: str = "Europe/Paris"

    def internal_api_token(self) -> str:
        return self.internal_api_token_file.read_text().strip()


@lru_cache
def get_settings() -> Settings:
    return Settings()
