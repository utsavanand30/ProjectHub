from uuid import UUID
from typing import Any, Optional
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog


def log_change(
    db: Session,
    entity_type: str,
    entity_id: UUID,
    action: str,
    changed_by: Optional[UUID],
    old_value: Optional[Any] = None,
    new_value: Optional[Any] = None,
) -> AuditLog:
    """
    Write an immutable audit entry. Call before committing the parent change
    so both end up in the same transaction.
    """
    entry = AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        changed_by=changed_by,
        old_value=old_value,
        new_value=new_value,
    )
    db.add(entry)
    return entry
