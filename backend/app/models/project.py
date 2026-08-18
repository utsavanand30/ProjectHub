import enum
from sqlalchemy import Column, String, Text, Date, Integer, Boolean, Enum, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.db.base_class import Base, UUIDMixin, TimestampMixin


class ProjectStatus(str, enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    on_hold = "on_hold"
    completed = "completed"
    cancelled = "cancelled"


class ProjectHealth(str, enum.Enum):
    green = "green"
    amber = "amber"
    red = "red"


class ProjectPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class Project(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "projects"

    project_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    project_manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    start_date = Column(Date, nullable=True)
    target_completion_date = Column(Date, nullable=True)
    expected_completion_date = Column(Date, nullable=True)
    priority = Column(Enum(ProjectPriority), nullable=False, default=ProjectPriority.medium)
    status = Column(Enum(ProjectStatus), nullable=False, default=ProjectStatus.not_started)
    health = Column(Enum(ProjectHealth), nullable=False, default=ProjectHealth.green)
    progress_percentage = Column(Integer, default=0, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    # Relationships
    project_manager = relationship("User", back_populates="managed_projects", foreign_keys=[project_manager_id])
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="project")
    updates = relationship("ProjectUpdate", back_populates="project", order_by="ProjectUpdate.created_at.desc()")
    risks = relationship("Risk", back_populates="project")
    issues = relationship("Issue", back_populates="project")


class ProjectMember(Base, TimestampMixin):
    __tablename__ = "project_members"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    # Relationships
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_memberships")
