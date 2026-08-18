from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user, require_admin_or_pm
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectListResponse
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=List[ProjectListResponse])
def list_projects(
    status: Optional[str] = Query(None),
    health: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    pm_id: Optional[UUID] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = project_service.get_projects(
        db, current_user,
        status_filter=status,
        health_filter=health,
        priority_filter=priority,
        pm_id=pm_id,
        skip=skip,
        limit=limit,
    )
    return projects


@router.post("", response_model=ProjectResponse, status_code=201)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_pm),
):
    return project_service.create_project(db, payload, created_by=current_user.id)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return project_service.get_project(db, project_id, current_user)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_pm),
):
    return project_service.update_project(db, project_id, payload, updated_by=current_user.id)


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin_or_pm),
):
    project_service.delete_project(db, project_id, deleted_by=current_user.id)
