from sqlalchemy import Column, Text, Date, Integer, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin
from app.models.project import ProjectStatus, ProjectHealth


class ProjectUpdate(Base, UUIDMixin, TimestampMixin):
    """Immutable snapshot — one row per update, never modified."""
    __tablename__ = "project_updates"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Snapshot fields
    progress_percentage = Column(Integer, nullable=False)
    status = Column(Enum(ProjectStatus), nullable=False)
    health = Column(Enum(ProjectHealth), nullable=False)

    key_achievements = Column(Text, nullable=True)
    key_issues = Column(Text, nullable=True)
    risks = Column(Text, nullable=True)
    next_actions = Column(Text, nullable=True)
    expected_completion_date = Column(Date, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="updates")
    updated_by_user = relationship("User", back_populates="project_updates")
