from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.issue import IssueCreate, IssueUpdate, IssueResponse
from app.services import issue_service

router = APIRouter(prefix="/projects/{project_id}/issues", tags=["issues"])


@router.get("", response_model=List[IssueResponse])
def list_issues(
    project_id: UUID,
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return issue_service.get_issues(db, project_id, current_user, status_filter=status)


@router.post("", response_model=IssueResponse, status_code=201)
def create_issue(
    project_id: UUID,
    payload: IssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return issue_service.create_issue(db, project_id, payload, current_user)


@router.patch("/{issue_id}", response_model=IssueResponse)
def update_issue(
    project_id: UUID,
    issue_id: UUID,
    payload: IssueUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return issue_service.update_issue(db, issue_id, payload, current_user)


@router.delete("/{issue_id}", status_code=204)
def delete_issue(
    project_id: UUID,
    issue_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    issue_service.delete_issue(db, issue_id, current_user)
