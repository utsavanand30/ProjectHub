from datetime import date
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.project import Project, ProjectStatus, ProjectHealth, ProjectMember
from app.models.activity import Activity
from app.models.project_update import ProjectUpdate
from app.models.user import User, UserRole
from app.schemas.dashboard import DashboardResponse, ProjectStats
from app.services.risk_service import get_open_risks
from app.services.issue_service import get_open_issues


def get_dashboard(db: Session, current_user: User) -> DashboardResponse:
    # ── Build base project query scoped to user ────────────────────────────────
    project_query = db.query(Project).filter(Project.is_deleted == False)

    if current_user.role == UserRole.team_member:
        project_query = project_query.join(
            ProjectMember, ProjectMember.project_id == Project.id
        ).filter(ProjectMember.user_id == current_user.id)
    elif current_user.role == UserRole.project_manager:
        from sqlalchemy import or_
        member_sub = db.query(ProjectMember.project_id).filter(
            ProjectMember.user_id == current_user.id
        ).subquery()
        project_query = project_query.filter(
            or_(
                Project.project_manager_id == current_user.id,
                Project.id.in_(member_sub),
            )
        )

    projects = project_query.all()

    # ── Stats ──────────────────────────────────────────────────────────────────
    status_counts = {s.value: 0 for s in ProjectStatus}
    health_counts = {h.value: 0 for h in ProjectHealth}
    total_progress = 0

    for p in projects:
        status_counts[p.status.value] += 1
        health_counts[p.health.value] += 1
        total_progress += p.progress_percentage

    avg_progress = total_progress / len(projects) if projects else 0.0

    stats = ProjectStats(
        total=len(projects),
        not_started=status_counts["not_started"],
        in_progress=status_counts["in_progress"],
        on_hold=status_counts["on_hold"],
        completed=status_counts["completed"],
        cancelled=status_counts["cancelled"],
        on_track=health_counts["green"],
        at_risk=health_counts["amber"],
        delayed=health_counts["red"],
        avg_progress=round(avg_progress, 1),
    )

    # ── Recent project updates (last 5) ───────────────────────────────────────
    project_ids = [p.id for p in projects]
    recent_updates = []
    if project_ids:
        recent_updates = (
            db.query(ProjectUpdate)
            .options(joinedload(ProjectUpdate.updated_by_user))
            .filter(ProjectUpdate.project_id.in_(project_ids))
            .order_by(ProjectUpdate.created_at.desc())
            .limit(5)
            .all()
        )

    # ── Today's activities ────────────────────────────────────────────────────
    today = date.today()
    activity_query = db.query(Activity).options(
        joinedload(Activity.user), joinedload(Activity.project)
    ).filter(Activity.date == today)

    if current_user.role == UserRole.team_member:
        activity_query = activity_query.filter(Activity.user_id == current_user.id)
    elif current_user.role == UserRole.project_manager and project_ids:
        from sqlalchemy import or_
        activity_query = activity_query.filter(
            or_(
                Activity.user_id == current_user.id,
                Activity.project_id.in_(project_ids),
            )
        )

    todays_activities = activity_query.limit(10).all()

    # ── Open risks / issues ────────────────────────────────────────────────────
    open_risks = get_open_risks(db, limit=5)
    open_issues = get_open_issues(db, limit=5)

    return DashboardResponse(
        project_stats=stats,
        recent_updates=recent_updates,
        todays_activities=todays_activities,
        open_risks=open_risks,
        open_issues=open_issues,
    )
