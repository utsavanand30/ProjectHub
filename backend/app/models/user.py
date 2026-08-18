import enum
from sqlalchemy import Column, String, Boolean, Enum
from sqlalchemy.orm import relationship

from app.db.base_class import Base, UUIDMixin, TimestampMixin


class UserRole(str, enum.Enum):
    admin = "admin"
    project_manager = "project_manager"
    team_member = "team_member"


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.team_member)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    managed_projects = relationship(
        "Project", back_populates="project_manager", foreign_keys="Project.project_manager_id"
    )
    project_memberships = relationship("ProjectMember", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    project_updates = relationship("ProjectUpdate", back_populates="updated_by_user")
    risks_owned = relationship("Risk", back_populates="owner", foreign_keys="Risk.owner_id")
    issues_owned = relationship("Issue", back_populates="owner", foreign_keys="Issue.owner_id")
    audit_logs = relationship("AuditLog", back_populates="changed_by_user")
