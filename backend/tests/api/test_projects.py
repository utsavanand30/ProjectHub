import pytest
from tests.conftest import make_user, auth_header
from app.models.user import UserRole


def _create_project(client, pm_user, extra=None):
    payload = {
        "project_code": "TEST-001",
        "name": "Test Project",
        "project_manager_id": str(pm_user.id),
        "priority": "medium",
        "status": "not_started",
        "health": "green",
        "progress_percentage": 0,
    }
    if extra:
        payload.update(extra)
    return client.post("/api/v1/projects", json=payload, headers=auth_header(pm_user))


def test_pm_can_create_project(client, pm_user):
    resp = _create_project(client, pm_user)
    assert resp.status_code == 201
    assert resp.json()["project_code"] == "TEST-001"


def test_team_member_cannot_create_project(client, member_user, pm_user):
    payload = {
        "project_code": "X-001",
        "name": "Illegal Project",
        "project_manager_id": str(pm_user.id),
        "priority": "low",
        "status": "not_started",
        "health": "green",
        "progress_percentage": 0,
    }
    resp = client.post("/api/v1/projects", json=payload, headers=auth_header(member_user))
    assert resp.status_code == 403


def test_duplicate_project_code_rejected(client, pm_user):
    _create_project(client, pm_user)
    resp = _create_project(client, pm_user)
    assert resp.status_code == 409


def test_list_projects(client, pm_user):
    _create_project(client, pm_user)
    resp = client.get("/api/v1/projects", headers=auth_header(pm_user))
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


def test_get_project(client, pm_user):
    created = _create_project(client, pm_user).json()
    resp = client.get(f"/api/v1/projects/{created['id']}", headers=auth_header(pm_user))
    assert resp.status_code == 200


def test_update_project(client, pm_user):
    created = _create_project(client, pm_user).json()
    resp = client.patch(
        f"/api/v1/projects/{created['id']}",
        json={"status": "in_progress", "progress_percentage": 25},
        headers=auth_header(pm_user),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"
    assert resp.json()["progress_percentage"] == 25


def test_delete_project(client, pm_user):
    created = _create_project(client, pm_user).json()
    resp = client.delete(f"/api/v1/projects/{created['id']}", headers=auth_header(pm_user))
    assert resp.status_code == 204

    # Should be gone
    resp2 = client.get(f"/api/v1/projects/{created['id']}", headers=auth_header(pm_user))
    assert resp2.status_code == 404


def test_progress_percentage_validation(client, pm_user):
    resp = _create_project(client, pm_user, {"progress_percentage": 150})
    assert resp.status_code == 422
