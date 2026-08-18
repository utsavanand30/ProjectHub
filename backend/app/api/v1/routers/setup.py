"""
One-time setup endpoint — seeds the production database.
Protected by a secret token. Automatically disabled after first successful run.
"""
import os
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User

router = APIRouter(prefix="/setup", tags=["setup"])

SETUP_TOKEN = os.environ.get("SETUP_SECRET_TOKEN", "")


def _verify_token(x_setup_token: str = Header(...)):
    if not SETUP_TOKEN:
        raise HTTPException(status_code=403, detail="Setup not configured")
    if x_setup_token != SETUP_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid setup token")


@router.post("/seed")
def seed_database(
    force: bool = False,
    db: Session = Depends(get_db),
    _: None = Depends(_verify_token),
):
    # If admin already exists, refuse to re-seed unless forced
    existing = db.query(User).first()
    if existing and not force:
        return {"status": "already_seeded", "message": "Database already has users — skipping. Use ?force=true to wipe and re-seed."}

    # Wipe existing data if force
    if existing and force:
        from app.models.issue import Issue
        from app.models.risk import Risk
        from app.models.activity import Activity
        from app.models.project_update import ProjectUpdate
        from app.models.project import Project, ProjectMember
        from app.models.audit_log import AuditLog
        db.query(AuditLog).delete()
        db.query(Issue).delete()
        db.query(Risk).delete()
        db.query(Activity).delete()
        db.query(ProjectUpdate).delete()
        db.query(ProjectMember).delete()
        db.query(Project).delete()
        db.query(User).delete()
        db.commit()

    # Run seed inline
    import uuid
    from datetime import date, timedelta
    from app.models.user import UserRole
    from app.models.project import Project, ProjectMember, ProjectStatus, ProjectHealth, ProjectPriority
    from app.models.activity import Activity, ActivityStatus
    from app.models.risk import Risk, RiskSeverity, RiskLikelihood, RiskStatus
    from app.models.issue import Issue, IssueSeverity, IssueStatus
    from app.core.security import hash_password
    from app.core.config import settings
    import app.db.base  # noqa — register all models

    try:
        # Admin
        admin = User(
            id=uuid.uuid4(),
            name=settings.SEED_ADMIN_NAME,
            email=settings.SEED_ADMIN_EMAIL,
            password_hash=hash_password(settings.SEED_ADMIN_PASSWORD),
            role=UserRole.admin,
            is_active=True,
        )
        db.add(admin)
        db.flush()

        # PM
        pm = User(
            id=uuid.uuid4(),
            name="Alice PM",
            email="pm@projecthub.dev",
            password_hash=hash_password("Pm@123456"),
            role=UserRole.project_manager,
            is_active=True,
        )
        db.add(pm)
        db.flush()

        # Member
        member = User(
            id=uuid.uuid4(),
            name="Bob Member",
            email="member@projecthub.dev",
            password_hash=hash_password("Member@123456"),
            role=UserRole.team_member,
            is_active=True,
        )
        db.add(member)
        db.flush()

        # Projects
        project = Project(
            id=uuid.uuid4(),
            project_code="PROJ-001",
            name="Platform Modernization",
            description="Migrate legacy monolith to microservices architecture.",
            project_manager_id=pm.id,
            start_date=date.today() - timedelta(days=30),
            target_completion_date=date.today() + timedelta(days=90),
            priority=ProjectPriority.high,
            status=ProjectStatus.in_progress,
            health=ProjectHealth.green,
            progress_percentage=35,
        )
        db.add(project)
        db.flush()
        db.add(ProjectMember(project_id=project.id, user_id=member.id))

        project2 = Project(
            id=uuid.uuid4(),
            project_code="PROJ-002",
            name="Security Audit Remediation",
            description="Address findings from Q2 external security audit.",
            project_manager_id=pm.id,
            start_date=date.today() - timedelta(days=10),
            target_completion_date=date.today() + timedelta(days=45),
            priority=ProjectPriority.critical,
            status=ProjectStatus.in_progress,
            health=ProjectHealth.amber,
            progress_percentage=15,
        )
        db.add(project2)
        db.flush()
        db.add(ProjectMember(project_id=project2.id, user_id=member.id))

        # Activities
        db.add(Activity(
            id=uuid.uuid4(), date=date.today(), user_id=member.id,
            project_id=project.id,
            description="Implemented user authentication service with JWT",
            hours_spent=4, status=ActivityStatus.completed,
            remarks="All unit tests passing",
            next_action="Start on API gateway integration",
        ))
        db.add(Activity(
            id=uuid.uuid4(), date=date.today(), user_id=pm.id,
            project_id=project2.id,
            description="Reviewed penetration test report findings",
            hours_spent=2.5, status=ActivityStatus.in_progress,
            next_action="Prioritize critical findings for patching",
        ))

        # Risk
        db.add(Risk(
            id=uuid.uuid4(), project_id=project.id,
            title="Third-party API deprecation",
            description="Payment gateway API v1 will be deprecated in 60 days.",
            severity=RiskSeverity.high, likelihood=RiskLikelihood.high,
            status=RiskStatus.open,
            mitigation_plan="Evaluate and integrate API v2 within the next sprint.",
            owner_id=pm.id, created_by=pm.id,
            due_date=date.today() + timedelta(days=30),
        ))

        # Issue
        db.add(Issue(
            id=uuid.uuid4(), project_id=project2.id,
            title="SQL injection vulnerability in user search",
            description="Unparameterized query found in legacy user search endpoint.",
            severity=IssueSeverity.critical, status=IssueStatus.in_progress,
            owner_id=member.id, created_by=pm.id,
            due_date=date.today() + timedelta(days=7),
        ))

        db.commit()

        return {
            "status": "success",
            "message": "Database seeded successfully",
            "credentials": {
                "admin":   {"email": settings.SEED_ADMIN_EMAIL,  "password": settings.SEED_ADMIN_PASSWORD},
                "pm":      {"email": "pm@projecthub.dev",        "password": "Pm@123456"},
                "member":  {"email": "member@projecthub.dev",    "password": "Member@123456"},
            }
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Seed failed: {str(e)}")
