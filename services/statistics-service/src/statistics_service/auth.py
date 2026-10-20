"""Verifies the JWT issued by account-service with its public key: no call to account-service."""

from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Annotated, Literal
from uuid import UUID

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import Settings, get_settings
from .errors import unauthorized

bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthenticatedUser:
    id: UUID
    role: Literal["standard", "admin"]


@lru_cache
def _read_public_key(path: Path) -> str:
    return path.read_text()


def decode_token(token: str, settings: Settings) -> AuthenticatedUser:
    try:
        payload = jwt.decode(
            token,
            _read_public_key(settings.jwt_public_key),
            algorithms=["RS256"],
            audience=settings.jwt_audience,
            issuer=settings.jwt_issuer,
            options={"require": ["exp", "iat", "sub", "iss", "aud"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise unauthorized("expired_token", "The access token has expired.") from exc
    except jwt.InvalidTokenError as exc:
        raise unauthorized("invalid_token", "The access token is invalid.") from exc

    try:
        user_id = UUID(payload["sub"])
    except (TypeError, ValueError) as exc:
        raise unauthorized("invalid_token", "The access token is invalid.") from exc

    role = payload.get("role")
    if role not in ("standard", "admin"):
        raise unauthorized("invalid_token", "The access token is invalid.")

    return AuthenticatedUser(id=user_id, role=role)


def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> AuthenticatedUser:
    if credentials is None:
        raise unauthorized("missing_token", "Authentication is required.")
    return decode_token(credentials.credentials, settings)


CurrentUser = Annotated[AuthenticatedUser, Depends(current_user)]
