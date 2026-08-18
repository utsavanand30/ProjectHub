from uuid import UUID
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.project import Project, ProjectMember
from app.models.user import User, UserRole
from app.schemas.project import ProjectCreate, ProjectUpdate
from app.services.audit import log_change


def _load_project(db: Session, project_id: UUID) -> Project:
    project = (
        db.query(Project)
        .options(
            joinedload(Project.project_manager),
            joinedload(Project.members).joinedload(ProjectMember.user),
        )
        .filter(Project.id == project_id, Project.is_deleted == False)
        .first()
    )
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project


def get_projects(
    db: Session,
    current_user: User,
    status_filter: Optional[str] = None,
    health_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    pm_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Project]:
    query = (
        db.query(Project)
        .options(
            joinedload(Project.project_manager),
            joinedload(Project.members).joinedload(ProjectMember.user),
        )
        .filter(Project.is_deleted == False)
    )

    # Team members only see their assigned projects
    if current_user.role == UserRole.team_member:
        query = query.join(ProjectMember, ProjectMember.project_id == Project.id).filter(
            ProjectMember.user_id == current_user.id
        )
    # PMs see their own projects + projects they are a member of
    elif current_user.role == UserRole.project_manager:
        from sqlalchemy import or_
        member_sub = db.query(ProjectMember.project_id).filter(
            ProjectMember.user_id == current_user.id
        ).subquery()
        query = query.filter(
            or_(
                Project.project_manager_id == current_user.id,
                Project.id.in_(member_sub),
            )
        )

    if status_filter:
        query = query.filter(Project.status == status_filter)
    if health_filter:
        query = query.filter(Project.health == health_filter)
    if priority_filter:
        query = query.filter(Project.priority == priority_filter)
    if pm_id:
        query = query.filter(Project.project_manager_id == pm_id)

    return query.offset(skip).limit(limit).all()


def get_project(db: Session, project_id: UUID, current_user: User) -> Project:
    project = _load_project(db, project_id)
    _check_project_access(project, current_user)
    return project


def _check_project_access(project: Project, user: User) -> None:
    if user.role == UserRole.admin:
        return
    if user.role == UserRole.project_manager and project.project_manager_id == user.id:
        return
    member_ids = {pm.user_id for pm in project.members}
    if user.id in member_ids:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this project")


def create_project(db: Session, payload: ProjectCreate, created_by: UUID) -> Project:
    existing = db.query(Project).filter(Project.project_code == payload.project_code).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Project code already exists")

    project = Project(
        project_code=payload.project_code,
        name=payload.name,
        description=payload.description,
        project_manager_id=payload.project_manager_id,
        start_date=payload.start_date,
        target_completion_date=payload.target_completion_date,
        priority=payload.priority,
        status=payload.status,
        health=payload.health,
        progress_percentage=payload.progress_percentage,
    )
    db.add(project)
    db.flush()

    # Add members
    for uid in (payload.member_ids or []):
        db.add(ProjectMember(project_id=project.id, user_id=uid))

    log_change(
        db,
        entity_type="project",
        entity_id=project.id,
        action="created",
        changed_by=created_by,
        new_value={"name": project.name, "status": project.status.value},
    )
    db.commit()
    return _load_project(db, project.id)


def update_project(db: Session, project_id: UUID, payload: ProjectUpdate, updated_by: UUID) -> Project:
    project = _load_project(db, project_id)
    old_snapshot = {
        "status": project.status.value,
        "health": project.health.value,
        "progress_percentage": project.progress_percentage,
    }

    update_data = payload.model_dump(exclude_unset=True, exclude={"member_ids"})
    for field, value in update_data.items():
        setattr(project, field, value)

    new_snapshot = {
        "status": project.status.value,
        "health": project.health.value,
        "progress_percentage": project.progress_percentage,
    }

    if old_snapshot != new_snapshot:
        log_change(
            db,
            entity_type="project",
            entity_id=project.id,
            action="updated",
            changed_by=updated_by,
            old_value=old_snapshot,
            new_value=new_snapshot,
        )

    # Sync members if provided
    if payload.member_ids is not None:
        db.query(ProjectMember).filter(ProjectMember.project_id == project.id).delete()
        for uid in payload.member_ids:
            db.add(ProjectMember(project_id=project.id, user_id=uid))

    db.commit()
    return _load_project(db, project.id)


def delete_project(db: Session, project_id: UUID, deleted_by: UUID) -> None:
    project = _load_project(db, project_id)
    project.is_deleted = True
    log_change(
        db,
        entity_type="project",
        entity_id=project.id,
        action="deleted",
        changed_by=deleted_by,
        old_value={"name": project.name},
    )
    db.commit()
