from uuid import UUID
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel

from app.schemas.user import UserSummary


class AuditLogResponse(BaseModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    action: str
    changed_by: Optional[UUID] = None
    changed_by_user: Optional[UserSummary] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    created_at: datetime

    model_config = {"from_attributes": True}
