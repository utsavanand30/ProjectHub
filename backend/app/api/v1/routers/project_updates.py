from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user, require_admin_or_pm
from app.models.user import User
from app.schemas.project_update import ProjectUpdateCreate, ProjectUpdateResponse
from app.services import project_update_service

router = APIRouter(prefix="/projects/{project_id}/updates", tags=["project-updates"])


@router.get("", response_model=List[ProjectUpdateResponse])
def list_updates(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return project_update_service.get_project_updates(db, project_id)


@router.post("", response_model=ProjectUpdateResponse, status_code=201)
def create_update(
    project_id: UUID,
    payload: ProjectUpdateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_pm),
):
    return project_update_service.create_project_update(db, project_id, payload, current_user)
