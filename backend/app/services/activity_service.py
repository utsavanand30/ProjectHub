from uuid import UUID
from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status

from app.models.activity import Activity
from app.models.project import ProjectMember
from app.models.user import User, UserRole
from app.schemas.activity import ActivityCreate, ActivityUpdate


def _load_activity(db: Session, activity_id: UUID) -> Activity:
    activity = (
        db.query(Activity)
        .options(joinedload(Activity.user), joinedload(Activity.project))
        .filter(Activity.id == activity_id)
        .first()
    )
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    return activity


def _check_activity_access(activity: Activity, user: User, write: bool = False) -> None:
    """Read: own + PM of project + admin. Write: own + admin."""
    if user.role == UserRole.admin:
        return
    if activity.user_id == user.id:
        return
    if not write and user.role == UserRole.project_manager:
        if activity.project.project_manager_id == user.id:
            return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def get_activities(
    db: Session,
    current_user: User,
    date_filter: Optional[date] = None,
    user_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Activity]:
    query = db.query(Activity).options(
        joinedload(Activity.user), joinedload(Activity.project)
    )

    if current_user.role == UserRole.team_member:
        query = query.filter(Activity.user_id == current_user.id)
    elif current_user.role == UserRole.project_manager:
        from sqlalchemy import or_
        from app.models.project import Project
        pm_project_ids = db.query(Project.id).filter(
            Project.project_manager_id == current_user.id
        ).subquery()
        query = query.filter(
            or_(
                Activity.user_id == current_user.id,
                Activity.project_id.in_(pm_project_ids),
            )
        )

    if date_filter:
        query = query.filter(Activity.date == date_filter)
    if user_id:
        query = query.filter(Activity.user_id == user_id)
    if project_id:
        query = query.filter(Activity.project_id == project_id)
    if status_filter:
        query = query.filter(Activity.status == status_filter)

    return query.order_by(Activity.date.desc()).offset(skip).limit(limit).all()


def get_activity(db: Session, activity_id: UUID, current_user: User) -> Activity:
    activity = _load_activity(db, activity_id)
    _check_activity_access(activity, current_user)
    return activity


def create_activity(db: Session, payload: ActivityCreate, user_id: UUID) -> Activity:
    activity = Activity(
        date=payload.date,
        user_id=user_id,
        project_id=payload.project_id,
        description=payload.description,
        hours_spent=payload.hours_spent,
        status=payload.status,
        remarks=payload.remarks,
        next_action=payload.next_action,
    )
    db.add(activity)
    db.commit()
    return _load_activity(db, activity.id)


def update_activity(
    db: Session, activity_id: UUID, payload: ActivityUpdate, current_user: User
) -> Activity:
    activity = _load_activity(db, activity_id)
    _check_activity_access(activity, current_user, write=True)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(activity, field, value)

    db.commit()
    return _load_activity(db, activity.id)


def delete_activity(db: Session, activity_id: UUID, current_user: User) -> None:
    activity = _load_activity(db, activity_id)
    _check_activity_access(activity, current_user, write=True)
    db.delete(activity)
    db.commit()
