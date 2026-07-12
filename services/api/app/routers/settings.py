from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import DecisionEventType, User, UserSettings
from app.schemas import UserSettingsResponse, UserSettingsUpdate
from app.services.trades import log_decision

router = APIRouter(prefix="/settings", tags=["settings"])


def _get_or_create_settings(db: Session, user: User) -> UserSettings:
    settings = db.query(UserSettings).filter(UserSettings.user_id == user.id).first()
    if not settings:
        settings = UserSettings(user_id=user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("", response_model=UserSettingsResponse)
def get_settings(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserSettingsResponse:
    return _get_or_create_settings(db, current_user)


@router.patch("", response_model=UserSettingsResponse)
def update_settings(
    payload: UserSettingsUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserSettingsResponse:
    settings = _get_or_create_settings(db, current_user)
    changes = {}
    if payload.auto_trade_enabled is not None:
        settings.auto_trade_enabled = payload.auto_trade_enabled
        changes["auto_trade_enabled"] = payload.auto_trade_enabled
    if payload.risk_profile is not None:
        settings.risk_profile = payload.risk_profile
        changes["risk_profile"] = payload.risk_profile.value
    db.commit()
    db.refresh(settings)
    if changes:
        portfolio = current_user.portfolios[0] if current_user.portfolios else None
        log_decision(
            db,
            portfolio_id=portfolio.id if portfolio else settings.id,
            user_id=current_user.id,
            event_type=DecisionEventType.SETTINGS_UPDATED,
            payload=changes,
        )
    return settings
