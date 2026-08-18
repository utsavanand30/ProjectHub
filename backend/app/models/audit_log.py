from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin


class AuditLog(Base, UUIDMixin, TimestampMixin):
    """Append-only audit trail. No update/delete endpoints exposed."""
    __tablename__ = "audit_logs"

    entity_type = Column(String(50), nullable=False, index=True)   # e.g. "project", "user"
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    action = Column(String(100), nullable=False)                    # e.g. "status_changed"
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)

    # Relationships
    changed_by_user = relationship("User", back_populates="audit_logs")
