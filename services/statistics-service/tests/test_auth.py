import base64
import hashlib
import hmac
import json
import time

import pytest

from statistics_service.auth import decode_token
from statistics_service.config import get_settings
from statistics_service.errors import ApiError
from tests.conftest import USER_ID


def test_valid_token_gives_the_user(make_token):
    user = decode_token(make_token(role="admin"), get_settings())

    assert user.id == USER_ID
    assert user.role == "admin"


@pytest.mark.parametrize(
    ("overrides", "error"),
    [
        ({"exp": int(time.time()) - 10}, "expired_token"),
        ({"aud": "another-app"}, "invalid_token"),
        ({"iss": "someone-else"}, "invalid_token"),
        ({"role": "superadmin"}, "invalid_token"),
        ({"sub": "not-a-uuid"}, "invalid_token"),
        ({"exp": None}, "invalid_token"),
    ],
    ids=["expired", "wrong-audience", "wrong-issuer", "unknown-role", "sub-not-uuid", "no-expiry"],
)
def test_rejected_claims(make_token, overrides, error):
    with pytest.raises(ApiError) as exc:
        decode_token(make_token(**overrides), get_settings())

    assert exc.value.status_code == 401
    assert exc.value.error == error


def test_token_signed_with_another_key_is_rejected(make_token, other_private_key):
    with pytest.raises(ApiError) as exc:
        decode_token(make_token(key=other_private_key), get_settings())

    assert exc.value.error == "invalid_token"


def test_symmetric_algorithm_is_refused():
    # Classic attack: HS256 "signed" with the public key, which everybody knows.
    # Built by hand because PyJWT refuses to produce such a token.
    def b64(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).rstrip(b"=").decode()

    now = int(time.time())
    header = b64(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = b64(
        json.dumps(
            {"sub": str(USER_ID), "role": "admin", "iss": "account-service", "aud": "nero", "iat": now, "exp": now + 900}
        ).encode()
    )
    public_key = get_settings().jwt_public_key.read_bytes()
    signature = b64(hmac.new(public_key, f"{header}.{payload}".encode(), hashlib.sha256).digest())

    with pytest.raises(ApiError) as exc:
        decode_token(f"{header}.{payload}.{signature}", get_settings())

    assert exc.value.error == "invalid_token"
