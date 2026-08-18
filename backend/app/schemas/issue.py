from uuid import UUID
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel

from app.models.issue import IssueSeverity, IssueStatus
from app.schemas.user import UserSummary


class IssueBase(BaseModel):
    title: str
    description: Optional[str] = None
    severity: IssueSeverity = IssueSeverity.medium
    status: IssueStatus = IssueStatus.open
    resolution: Optional[str] = None
    owner_id: Optional[UUID] = None
    due_date: Optional[date] = None


class IssueCreate(IssueBase):
    pass


class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[IssueSeverity] = None
    status: Optional[IssueStatus] = None
    resolution: Optional[str] = None
    owner_id: Optional[UUID] = None
    due_date: Optional[date] = None


class IssueResponse(IssueBase):
    id: UUID
    project_id: UUID
    created_by: UUID
    owner: Optional[UserSummary] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
