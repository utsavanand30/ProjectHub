from uuid import UUID
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import hash_password
from app.services.audit import log_change


def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()


def get_user(db: Session, user_id: UUID) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, payload: UserCreate, created_by: Optional[UUID] = None) -> User:
    if get_user_by_email(db, payload.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = User(
        name=payload.name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_active=payload.is_active,
    )
    db.add(user)
    db.flush()  # get the ID before audit log
    log_change(
        db,
        entity_type="user",
        entity_id=user.id,
        action="created",
        changed_by=created_by,
        new_value={"name": user.name, "email": user.email, "role": user.role.value},
    )
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user_id: UUID, payload: UserUpdate, updated_by: UUID) -> User:
    user = get_user(db, user_id)
    old_snapshot = {"role": user.role.value, "is_active": user.is_active}

    update_data = payload.model_dump(exclude_unset=True)

    if "password" in update_data:
        user.password_hash = hash_password(update_data.pop("password"))

    if "email" in update_data and update_data["email"] != user.email:
        if get_user_by_email(db, update_data["email"]):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")

    for field, value in update_data.items():
        setattr(user, field, value)

    new_snapshot = {"role": user.role.value, "is_active": user.is_active}

    # Only audit if role or active status changed
    if old_snapshot != new_snapshot:
        log_change(
            db,
            entity_type="user",
            entity_id=user.id,
            action="updated",
            changed_by=updated_by,
            old_value=old_snapshot,
            new_value=new_snapshot,
        )

    db.commit()
    db.refresh(user)
    return user
