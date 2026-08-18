from fastapi import APIRouter

from app.api.v1.routers import (
    auth,
    users,
    projects,
    activities,
    project_updates,
    risks,
    issues,
    dashboard,
    audit,
    setup,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(activities.router)
api_router.include_router(project_updates.router)
api_router.include_router(risks.router)
api_router.include_router(issues.router)
api_router.include_router(dashboard.router)
api_router.include_router(audit.router)
api_router.include_router(setup.router)
