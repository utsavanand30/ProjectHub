from uuid import UUID
from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, field_validator

from app.models.project import ProjectStatus, ProjectHealth
from app.schemas.user import UserSummary


class ProjectUpdateCreate(BaseModel):
    progress_percentage: int
    status: ProjectStatus
    health: ProjectHealth
    key_achievements: Optional[str] = None
    key_issues: Optional[str] = None
    risks: Optional[str] = None
    next_actions: Optional[str] = None
    expected_completion_date: Optional[date] = None

    @field_validator("progress_percentage")
    @classmethod
    def clamp_progress(cls, v: int) -> int:
        if not 0 <= v <= 100:
            raise ValueError("progress_percentage must be between 0 and 100")
        return v


class ProjectUpdateResponse(ProjectUpdateCreate):
    id: UUID
    project_id: UUID
    updated_by: UUID
    updated_by_user: UserSummary
    created_at: datetime

    model_config = {"from_attributes": True}
