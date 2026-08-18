from typing import List, Optional
from pydantic import BaseModel
from datetime import date

from app.schemas.project import ProjectListResponse
from app.schemas.activity import ActivityResponse
from app.schemas.risk import RiskResponse
from app.schemas.issue import IssueResponse
from app.schemas.project_update import ProjectUpdateResponse


class ProjectStats(BaseModel):
    total: int
    not_started: int
    in_progress: int
    on_hold: int
    completed: int
    cancelled: int
    on_track: int      # health = green
    at_risk: int       # health = amber
    delayed: int       # health = red
    avg_progress: float


class DashboardResponse(BaseModel):
    project_stats: ProjectStats
    recent_updates: List[ProjectUpdateResponse]
    todays_activities: List[ActivityResponse]
    open_risks: List[RiskResponse]
    open_issues: List[IssueResponse]
