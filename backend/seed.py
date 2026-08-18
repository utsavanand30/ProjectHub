"""
Seed script: creates admin user + sample data for local development.

Usage (from /backend directory):
    python seed.py

Or via Docker:
    docker compose exec backend python seed.py
"""
import os
import sys
from datetime import date, timedelta

# Ensure the backend root is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
import app.db.base  # noqa: F401 — registers all models so relationships resolve
from app.models.user import User, UserRole
from app.models.project import Project, ProjectMember, ProjectStatus, ProjectHealth, ProjectPriority
from app.models.activity import Activity, ActivityStatus
from app.models.risk import Risk, RiskSeverity, RiskLikelihood, RiskStatus
from app.models.issue import Issue, IssueSeverity, IssueStatus
from app.core.security import hash_password
from app.core.config import settings

import uuid


def seed():
    db = SessionLocal()
    try:
        # ── Admin user ─────────────────────────────────────────────────────────
        admin = db.query(User).filter(User.email == settings.SEED_ADMIN_EMAIL).first()
        if not admin:
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
            print(f"  Created admin: {admin.email}")
        else:
            print(f"  Admin already exists: {admin.email}")

        # ── Project Manager ────────────────────────────────────────────────────
        pm = db.query(User).filter(User.email == "pm@projecthub.dev").first()
        if not pm:
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
            print("  Created PM: pm@projecthub.dev / Pm@123456")

        # ── Team Member ────────────────────────────────────────────────────────
        member = db.query(User).filter(User.email == "member@projecthub.dev").first()
        if not member:
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
            print("  Created member: member@projecthub.dev / Member@123456")

        db.commit()

        # ── Sample Project ─────────────────────────────────────────────────────
        project = db.query(Project).filter(Project.project_code == "PROJ-001").first()
        if not project:
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
            print(f"  Created project: {project.project_code} - {project.name}")

        project2 = db.query(Project).filter(Project.project_code == "PROJ-002").first()
        if not project2:
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
            print(f"  Created project: {project2.project_code} - {project2.name}")

        db.commit()

        # ── Sample Activities ──────────────────────────────────────────────────
        if not db.query(Activity).first():
            db.add(Activity(
                id=uuid.uuid4(),
                date=date.today(),
                user_id=member.id,
                project_id=project.id,
                description="Implemented user authentication service with JWT",
                hours_spent=4,
                status=ActivityStatus.completed,
                remarks="All unit tests passing",
                next_action="Start on API gateway integration",
            ))
            db.add(Activity(
                id=uuid.uuid4(),
                date=date.today(),
                user_id=pm.id,
                project_id=project2.id,
                description="Reviewed penetration test report findings",
                hours_spent=2.5,
                status=ActivityStatus.in_progress,
                next_action="Prioritize critical findings for patching",
            ))
            db.commit()
            print("  Created sample activities")

        # ── Sample Risk ────────────────────────────────────────────────────────
        if not db.query(Risk).first():
            db.add(Risk(
                id=uuid.uuid4(),
                project_id=project.id,
                title="Third-party API deprecation",
                description="Payment gateway API v1 will be deprecated in 60 days.",
                severity=RiskSeverity.high,
                likelihood=RiskLikelihood.high,
                status=RiskStatus.open,
                mitigation_plan="Evaluate and integrate API v2 within the next sprint.",
                owner_id=pm.id,
                created_by=pm.id,
                due_date=date.today() + timedelta(days=30),
            ))
            db.commit()
            print("  Created sample risk")

        # ── Sample Issue ───────────────────────────────────────────────────────
        if not db.query(Issue).first():
            db.add(Issue(
                id=uuid.uuid4(),
                project_id=project2.id,
                title="SQL injection vulnerability in user search",
                description="Unparameterized query found in legacy user search endpoint.",
                severity=IssueSeverity.critical,
                status=IssueStatus.in_progress,
                owner_id=member.id,
                created_by=pm.id,
                due_date=date.today() + timedelta(days=7),
            ))
            db.commit()
            print("  Created sample issue")

        print("\nSeed complete.")
        print("\nLogin credentials:")
        print(f"  Admin:   {settings.SEED_ADMIN_EMAIL} / {settings.SEED_ADMIN_PASSWORD}")
        print("  PM:      pm@projecthub.dev / Pm@123456")
        print("  Member:  member@projecthub.dev / Member@123456")

    except Exception as e:
        db.rollback()
        print(f"\nSeed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding database...")
    seed()
