from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.risk import RiskCreate, RiskUpdate, RiskResponse
from app.services import risk_service

router = APIRouter(prefix="/projects/{project_id}/risks", tags=["risks"])


@router.get("", response_model=List[RiskResponse])
def list_risks(
    project_id: UUID,
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return risk_service.get_risks(db, project_id, current_user, status_filter=status)


@router.post("", response_model=RiskResponse, status_code=201)
def create_risk(
    project_id: UUID,
    payload: RiskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return risk_service.create_risk(db, project_id, payload, current_user)


@router.patch("/{risk_id}", response_model=RiskResponse)
def update_risk(
    project_id: UUID,
    risk_id: UUID,
    payload: RiskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return risk_service.update_risk(db, risk_id, payload, current_user)


@router.delete("/{risk_id}", status_code=204)
def delete_risk(
    project_id: UUID,
    risk_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    risk_service.delete_risk(db, risk_id, current_user)
