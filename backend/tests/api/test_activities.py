import pytest
from datetime import date
from tests.conftest import make_user, auth_header
from app.models.user import UserRole


def _create_project(client, pm_user):
    resp = client.post(
        "/api/v1/projects",
        json={
            "project_code": "ACT-001",
            "name": "Activity Test Project",
            "project_manager_id": str(pm_user.id),
            "priority": "medium",
            "status": "in_progress",
            "health": "green",
            "progress_percentage": 10,
        },
        headers=auth_header(pm_user),
    )
    return resp.json()


def _create_activity(client, user, project_id, date_str=None):
    return client.post(
        "/api/v1/activities",
        json={
            "date": date_str or str(date.today()),
            "project_id": str(project_id),
            "description": "Worked on feature X",
            "hours_spent": "3.5",
            "status": "completed",
        },
        headers=auth_header(user),
    )


def test_create_activity(client, pm_user, member_user, db):
    project = _create_project(client, pm_user)
    # Add member to project
    client.patch(
        f"/api/v1/projects/{project['id']}",
        json={"member_ids": [str(member_user.id)]},
        headers=auth_header(pm_user),
    )
    resp = _create_activity(client, member_user, project["id"])
    assert resp.status_code == 201
    assert resp.json()["hours_spent"] == "3.5"


def test_user_can_only_see_own_activities(client, pm_user, member_user):
    project = _create_project(client, pm_user)
    _create_activity(client, pm_user, project["id"])

    # member has no activities — should get empty list
    resp = client.get("/api/v1/activities", headers=auth_header(member_user))
    assert resp.status_code == 200
    data = resp.json()
    # member only sees their own; pm's activity is not theirs
    for activity in data:
        assert activity["user_id"] == str(member_user.id)


def test_user_can_edit_past_activity(client, pm_user, member_user):
    project = _create_project(client, pm_user)
    client.patch(
        f"/api/v1/projects/{project['id']}",
        json={"member_ids": [str(member_user.id)]},
        headers=auth_header(pm_user),
    )
    created = _create_activity(client, member_user, project["id"]).json()
    resp = client.patch(
        f"/api/v1/activities/{created['id']}",
        json={"remarks": "Updated remark"},
        headers=auth_header(member_user),
    )
    assert resp.status_code == 200
    assert resp.json()["remarks"] == "Updated remark"


def test_user_cannot_edit_others_activity(client, pm_user, member_user):
    project = _create_project(client, pm_user)
    created = _create_activity(client, pm_user, project["id"]).json()
    resp = client.patch(
        f"/api/v1/activities/{created['id']}",
        json={"remarks": "Hack"},
        headers=auth_header(member_user),
    )
    assert resp.status_code == 403


def test_hours_validation(client, pm_user):
    project = _create_project(client, pm_user)
    resp = client.post(
        "/api/v1/activities",
        json={
            "date": str(date.today()),
            "project_id": str(project["id"]),
            "description": "Too many hours",
            "hours_spent": "25",
            "status": "completed",
        },
        headers=auth_header(pm_user),
    )
    assert resp.status_code == 422
