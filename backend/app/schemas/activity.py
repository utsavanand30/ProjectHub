from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, field_validator

from app.models.activity import ActivityStatus
from app.schemas.user import UserSummary


class ActivityBase(BaseModel):
    date: date
    project_id: UUID
    description: str
    hours_spent: Decimal
    status: ActivityStatus = ActivityStatus.in_progress
    remarks: Optional[str] = None
    next_action: Optional[str] = None

    @field_validator("hours_spent")
    @classmethod
    def validate_hours(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("hours_spent must be greater than 0")
        if v > 24:
            raise ValueError("hours_spent cannot exceed 24 per entry")
        return v


class ActivityCreate(ActivityBase):
    pass  # user_id is taken from the authenticated user


class ActivityUpdate(BaseModel):
    date: Optional[date] = None
    project_id: Optional[UUID] = None
    description: Optional[str] = None
    hours_spent: Optional[Decimal] = None
    status: Optional[ActivityStatus] = None
    remarks: Optional[str] = None
    next_action: Optional[str] = None

    @field_validator("hours_spent")
    @classmethod
    def validate_hours(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None:
            if v <= 0:
                raise ValueError("hours_spent must be greater than 0")
            if v > 24:
                raise ValueError("hours_spent cannot exceed 24 per entry")
        return v


class ActivityResponse(ActivityBase):
    id: UUID
    user_id: UUID
    user: UserSummary
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
