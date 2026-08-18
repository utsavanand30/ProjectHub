from uuid import UUID
from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.activity import ActivityCreate, ActivityUpdate, ActivityResponse
from app.services import activity_service

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("", response_model=List[ActivityResponse])
def list_activities(
    date: Optional[date] = Query(None),
    user_id: Optional[UUID] = Query(None),
    project_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return activity_service.get_activities(
        db, current_user,
        date_filter=date,
        user_id=user_id,
        project_id=project_id,
        status_filter=status,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=ActivityResponse, status_code=201)
def create_activity(
    payload: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return activity_service.create_activity(db, payload, user_id=current_user.id)


@router.get("/{activity_id}", response_model=ActivityResponse)
def get_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return activity_service.get_activity(db, activity_id, current_user)


@router.patch("/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: UUID,
    payload: ActivityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return activity_service.update_activity(db, activity_id, payload, current_user)


@router.delete("/{activity_id}", status_code=204)
def delete_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity_service.delete_activity(db, activity_id, current_user)
