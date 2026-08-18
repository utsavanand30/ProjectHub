from uuid import UUID
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.risk import Risk, RiskStatus
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.risk import RiskCreate, RiskUpdate


def _load_risk(db: Session, risk_id: UUID) -> Risk:
    risk = db.query(Risk).options(joinedload(Risk.owner)).filter(Risk.id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk not found")
    return risk


def _check_project_access(db: Session, project_id: UUID, user: User) -> Project:
    project = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if user.role == UserRole.team_member and project.project_manager_id != user.id:
        from app.models.project import ProjectMember
        member = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user.id,
        ).first()
        if not member:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return project


def get_risks(
    db: Session,
    project_id: UUID,
    current_user: User,
    status_filter: Optional[str] = None,
) -> List[Risk]:
    _check_project_access(db, project_id, current_user)
    query = db.query(Risk).options(joinedload(Risk.owner)).filter(Risk.project_id == project_id)
    if status_filter:
        query = query.filter(Risk.status == status_filter)
    return query.all()


def get_open_risks(db: Session, limit: int = 10) -> List[Risk]:
    return (
        db.query(Risk)
        .options(joinedload(Risk.owner))
        .filter(Risk.status == RiskStatus.open)
        .order_by(Risk.created_at.desc())
        .limit(limit)
        .all()
    )


def create_risk(db: Session, project_id: UUID, payload: RiskCreate, current_user: User) -> Risk:
    _check_project_access(db, project_id, current_user)
    risk = Risk(
        project_id=project_id,
        created_by=current_user.id,
        **payload.model_dump(),
    )
    db.add(risk)
    db.commit()
    return _load_risk(db, risk.id)


def update_risk(db: Session, risk_id: UUID, payload: RiskUpdate, current_user: User) -> Risk:
    risk = _load_risk(db, risk_id)
    _check_project_access(db, risk.project_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(risk, field, value)
    db.commit()
    return _load_risk(db, risk_id)


def delete_risk(db: Session, risk_id: UUID, current_user: User) -> None:
    risk = _load_risk(db, risk_id)
    _check_project_access(db, risk.project_id, current_user)
    db.delete(risk)
    db.commit()
