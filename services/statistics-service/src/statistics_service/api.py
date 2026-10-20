from datetime import date, datetime
from typing import Annotated, Any
from uuid import UUID
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query, Request, status

from .auth import CurrentUser
from .config import Settings, get_settings
from .errors import ApiError
from .models import OverviewResponse, ProgressionResponse, StrengthCurveResponse
from .stats_service import StatisticsService

router = APIRouter()


def get_statistics_service(request: Request) -> StatisticsService:
    return request.app.state.statistics


def get_today(settings: Annotated[Settings, Depends(get_settings)]) -> date:
    return datetime.now(ZoneInfo(settings.timezone)).date()


Service = Annotated[StatisticsService, Depends(get_statistics_service)]
Today = Annotated[date, Depends(get_today)]
From = Annotated[date | None, Query(alias="from", description="First day included (YYYY-MM-DD)")]
To = Annotated[date | None, Query(alias="to", description="Last day included (YYYY-MM-DD)")]


def ensure_valid_range(start: date | None, end: date | None) -> None:
    if start is not None and end is not None and start > end:
        raise ApiError(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "validation_failed", "'from' must be on or before 'to'."
        )


@router.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/stats/overview", response_model=OverviewResponse, tags=["stats"])
async def overview(
    user: CurrentUser,
    service: Service,
    today: Today,
    month: Annotated[
        str | None, Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$", description="YYYY-MM, current month by default")
    ] = None,
) -> Any:
    month_start = date.fromisoformat(f"{month}-01") if month else today.replace(day=1)
    return await service.overview(user.id, month_start, today)


@router.get("/stats/strength-curve", response_model=StrengthCurveResponse, tags=["stats"])
async def strength_curve(
    user: CurrentUser,
    service: Service,
    exercise_id: Annotated[UUID, Query(alias="exerciseId")],
    start: From = None,
    end: To = None,
) -> Any:
    ensure_valid_range(start, end)
    return await service.strength_curve(user.id, exercise_id, start, end)


@router.get("/stats/progression", response_model=ProgressionResponse, tags=["stats"])
async def progression(user: CurrentUser, service: Service, start: From = None, end: To = None) -> Any:
    ensure_valid_range(start, end)
    return await service.progression(user.id, start, end)
