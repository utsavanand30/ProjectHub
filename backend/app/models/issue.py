import enum
from sqlalchemy import Column, String, Text, Date, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin


class IssueSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class IssueStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class Issue(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "issues"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(Enum(IssueSeverity), nullable=False, default=IssueSeverity.medium)
    status = Column(Enum(IssueStatus), nullable=False, default=IssueStatus.open)
    resolution = Column(Text, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    due_date = Column(Date, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="issues")
    owner = relationship("User", back_populates="issues_owned", foreign_keys=[owner_id])
    creator = relationship("User", foreign_keys=[created_by])
