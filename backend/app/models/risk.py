import enum
from sqlalchemy import Column, String, Text, Date, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin


class RiskSeverity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class RiskLikelihood(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class RiskStatus(str, enum.Enum):
    open = "open"
    mitigated = "mitigated"
    closed = "closed"


class Risk(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "risks"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    severity = Column(Enum(RiskSeverity), nullable=False, default=RiskSeverity.medium)
    likelihood = Column(Enum(RiskLikelihood), nullable=False, default=RiskLikelihood.medium)
    status = Column(Enum(RiskStatus), nullable=False, default=RiskStatus.open)
    mitigation_plan = Column(Text, nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    due_date = Column(Date, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="risks")
    owner = relationship("User", back_populates="risks_owned", foreign_keys=[owner_id])
    creator = relationship("User", foreign_keys=[created_by])
