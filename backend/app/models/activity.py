import enum
from sqlalchemy import Column, String, Text, Date, Numeric, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin


class ActivityStatus(str, enum.Enum):
    planned = "planned"
    in_progress = "in_progress"
    completed = "completed"
    blocked = "blocked"


class Activity(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "activities"

    date = Column(Date, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    description = Column(Text, nullable=False)
    hours_spent = Column(Numeric(5, 2), nullable=False)
    status = Column(Enum(ActivityStatus), nullable=False, default=ActivityStatus.in_progress)
    remarks = Column(Text, nullable=True)
    next_action = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="activities")
    project = relationship("Project", back_populates="activities")
