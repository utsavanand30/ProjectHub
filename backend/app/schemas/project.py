from uuid import UUID
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, field_validator

from app.models.project import ProjectStatus, ProjectHealth, ProjectPriority
from app.schemas.user import UserSummary


class ProjectBase(BaseModel):
    project_code: str
    name: str
    description: Optional[str] = None
    start_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    priority: ProjectPriority = ProjectPriority.medium
    status: ProjectStatus = ProjectStatus.not_started
    health: ProjectHealth = ProjectHealth.green
    progress_percentage: int = 0

    @field_validator("progress_percentage")
    @classmethod
    def clamp_progress(cls, v: int) -> int:
        if not 0 <= v <= 100:
            raise ValueError("progress_percentage must be between 0 and 100")
        return v


class ProjectCreate(ProjectBase):
    project_manager_id: UUID
    member_ids: Optional[List[UUID]] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    project_manager_id: Optional[UUID] = None
    start_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    expected_completion_date: Optional[date] = None
    priority: Optional[ProjectPriority] = None
    status: Optional[ProjectStatus] = None
    health: Optional[ProjectHealth] = None
    progress_percentage: Optional[int] = None
    member_ids: Optional[List[UUID]] = None

    @field_validator("progress_percentage")
    @classmethod
    def clamp_progress(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and not 0 <= v <= 100:
            raise ValueError("progress_percentage must be between 0 and 100")
        return v


class ProjectMemberResponse(BaseModel):
    user: UserSummary

    model_config = {"from_attributes": True}


class ProjectResponse(ProjectBase):
    id: UUID
    project_manager_id: UUID
    project_manager: UserSummary
    expected_completion_date: Optional[date] = None
    members: List[UserSummary] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_members(cls, project) -> "ProjectResponse":
        data = {
            **{c.key: getattr(project, c.key) for c in project.__table__.columns},
            "project_manager": project.project_manager,
            "members": [pm.user for pm in project.members],
        }
        return cls(**data)


class ProjectListResponse(BaseModel):
    id: UUID
    project_code: str
    name: str
    project_manager: UserSummary
    priority: ProjectPriority
    status: ProjectStatus
    health: ProjectHealth
    progress_percentage: int
    target_completion_date: Optional[date] = None

    model_config = {"from_attributes": True}
