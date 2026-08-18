from uuid import UUID
from typing import List
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.project_update import ProjectUpdate
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.project_update import ProjectUpdateCreate
from app.services.audit import log_change


def get_project_updates(db: Session, project_id: UUID) -> List[ProjectUpdate]:
    return (
        db.query(ProjectUpdate)
        .options(joinedload(ProjectUpdate.updated_by_user))
        .filter(ProjectUpdate.project_id == project_id)
        .order_by(ProjectUpdate.created_at.desc())
        .all()
    )


def create_project_update(
    db: Session,
    project_id: UUID,
    payload: ProjectUpdateCreate,
    current_user: User,
) -> ProjectUpdate:
    project = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    # Only PM of this project or admin can post updates
    if current_user.role != UserRole.admin and project.project_manager_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the project manager or admin can post updates")

    old_snapshot = {
        "status": project.status.value,
        "health": project.health.value,
        "progress_percentage": project.progress_percentage,
    }

    # Snapshot is written as a new row, never updated
    update = ProjectUpdate(
        project_id=project_id,
        updated_by=current_user.id,
        progress_percentage=payload.progress_percentage,
        status=payload.status,
        health=payload.health,
        key_achievements=payload.key_achievements,
        key_issues=payload.key_issues,
        risks=payload.risks,
        next_actions=payload.next_actions,
        expected_completion_date=payload.expected_completion_date,
    )
    db.add(update)

    # Also update the live project fields
    project.status = payload.status
    project.health = payload.health
    project.progress_percentage = payload.progress_percentage
    if payload.expected_completion_date:
        project.expected_completion_date = payload.expected_completion_date

    new_snapshot = {
        "status": project.status.value,
        "health": project.health.value,
        "progress_percentage": project.progress_percentage,
    }

    if old_snapshot != new_snapshot:
        log_change(
            db,
            entity_type="project",
            entity_id=project_id,
            action="progress_update",
            changed_by=current_user.id,
            old_value=old_snapshot,
            new_value=new_snapshot,
        )

    db.commit()
    db.refresh(update)

    return (
        db.query(ProjectUpdate)
        .options(joinedload(ProjectUpdate.updated_by_user))
        .filter(ProjectUpdate.id == update.id)
        .first()
    )
