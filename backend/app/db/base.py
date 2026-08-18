"""
Import all models here so Alembic autogenerate can detect them.
"""
from app.db.base_class import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.project import Project, ProjectMember  # noqa: F401
from app.models.activity import Activity  # noqa: F401
from app.models.project_update import ProjectUpdate  # noqa: F401
from app.models.risk import Risk  # noqa: F401
from app.models.issue import Issue  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
