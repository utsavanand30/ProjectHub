from uuid import UUID
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

from app.models.risk import RiskSeverity, RiskLikelihood, RiskStatus
from app.schemas.user import UserSummary


class RiskBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: RiskSeverity = RiskSeverity.medium
    likelihood: RiskLikelihood = RiskLikelihood.medium
    status: RiskStatus = RiskStatus.open
    mitigation_plan: Optional[str] = None
    owner_id: Optional[UUID] = None
    due_date: Optional[date] = None


class RiskCreate(RiskBase):
    pass


class RiskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[RiskSeverity] = None
    likelihood: Optional[RiskLikelihood] = None
    status: Optional[RiskStatus] = None
    mitigation_plan: Optional[str] = None
    owner_id: Optional[UUID] = None
    due_date: Optional[date] = None


class RiskResponse(RiskBase):
    id: UUID
    project_id: UUID
    created_by: UUID
    owner: Optional[UserSummary] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
