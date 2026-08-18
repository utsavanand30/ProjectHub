from uuid import UUID
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.issue import Issue, IssueStatus
from app.models.project import Project
from app.models.user import User, UserRole
from app.schemas.issue import IssueCreate, IssueUpdate


def _load_issue(db: Session, issue_id: UUID) -> Issue:
    issue = db.query(Issue).options(joinedload(Issue.owner)).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


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


def get_issues(
    db: Session,
    project_id: UUID,
    current_user: User,
    status_filter: Optional[str] = None,
) -> List[Issue]:
    _check_project_access(db, project_id, current_user)
    query = db.query(Issue).options(joinedload(Issue.owner)).filter(Issue.project_id == project_id)
    if status_filter:
        query = query.filter(Issue.status == status_filter)
    return query.all()


def get_open_issues(db: Session, limit: int = 10) -> List[Issue]:
    return (
        db.query(Issue)
        .options(joinedload(Issue.owner))
        .filter(Issue.status.in_([IssueStatus.open, IssueStatus.in_progress]))
        .order_by(Issue.created_at.desc())
        .limit(limit)
        .all()
    )


def create_issue(db: Session, project_id: UUID, payload: IssueCreate, current_user: User) -> Issue:
    _check_project_access(db, project_id, current_user)
    issue = Issue(
        project_id=project_id,
        created_by=current_user.id,
        **payload.model_dump(),
    )
    db.add(issue)
    db.commit()
    return _load_issue(db, issue.id)


def update_issue(db: Session, issue_id: UUID, payload: IssueUpdate, current_user: User) -> Issue:
    issue = _load_issue(db, issue_id)
    _check_project_access(db, issue.project_id, current_user)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(issue, field, value)
    db.commit()
    return _load_issue(db, issue_id)


def delete_issue(db: Session, issue_id: UUID, current_user: User) -> None:
    issue = _load_issue(db, issue_id)
    _check_project_access(db, issue.project_id, current_user)
    db.delete(issue)
    db.commit()
