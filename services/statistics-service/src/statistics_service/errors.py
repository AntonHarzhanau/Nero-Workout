"""Same error format as the other services: { "error": "...", "message": "...", "details": {...} }."""

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


class ApiError(Exception):
    def __init__(self, status_code: int, error: str, message: str, headers: dict[str, str] | None = None):
        super().__init__(message)
        self.status_code = status_code
        self.error = error
        self.message = message
        self.headers = headers


def unauthorized(error: str, message: str) -> ApiError:
    return ApiError(status.HTTP_401_UNAUTHORIZED, error, message, headers={"WWW-Authenticate": "Bearer"})


def workout_service_unavailable() -> ApiError:
    return ApiError(
        status.HTTP_502_BAD_GATEWAY, "dependency_unavailable", "Workout data could not be retrieved from workout-service."
    )


def _body(error: str, message: str, details: dict | None = None) -> dict:
    body = {"error": error, "message": message}
    if details is not None:
        body["details"] = details
    return body


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def api_error(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(_body(exc.error, exc.message), status_code=exc.status_code, headers=exc.headers)

    @app.exception_handler(RequestValidationError)
    async def validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = {}
        for error in exc.errors():
            field = ".".join(str(part) for part in error["loc"] if part not in ("query", "path", "body"))
            details.setdefault(field, error["msg"])
        return JSONResponse(
            _body("validation_failed", "The request contains invalid data.", details),
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        error = str(exc.detail).lower().replace(" ", "_")
        return JSONResponse(_body(error, f"{exc.detail}."), status_code=exc.status_code, headers=exc.headers)
