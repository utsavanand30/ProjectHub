import pytest
from tests.conftest import make_user, auth_header
from app.models.user import UserRole


def test_admin_can_create_user(client, admin_user):
    resp = client.post(
        "/api/v1/users",
        json={"name": "New User", "email": "new@test.com", "password": "New@12345", "role": "team_member"},
        headers=auth_header(admin_user),
    )
    assert resp.status_code == 201
    assert resp.json()["email"] == "new@test.com"


def test_non_admin_cannot_create_user(client, pm_user):
    resp = client.post(
        "/api/v1/users",
        json={"name": "Hacker", "email": "hack@test.com", "password": "Hack@12345", "role": "admin"},
        headers=auth_header(pm_user),
    )
    assert resp.status_code == 403


def test_duplicate_email_rejected(client, admin_user, db):
    make_user(db, "existing@test.com")
    resp = client.post(
        "/api/v1/users",
        json={"name": "Dup", "email": "existing@test.com", "password": "Dup@12345", "role": "team_member"},
        headers=auth_header(admin_user),
    )
    assert resp.status_code == 409


def test_admin_can_list_users(client, admin_user):
    resp = client.get("/api/v1/users", headers=auth_header(admin_user))
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_user_can_view_self(client, member_user):
    resp = client.get(f"/api/v1/users/{member_user.id}", headers=auth_header(member_user))
    assert resp.status_code == 200


def test_user_cannot_view_other(client, member_user, pm_user):
    resp = client.get(f"/api/v1/users/{pm_user.id}", headers=auth_header(member_user))
    assert resp.status_code == 403


def test_weak_password_rejected(client, admin_user):
    resp = client.post(
        "/api/v1/users",
        json={"name": "Weak", "email": "weak@test.com", "password": "short", "role": "team_member"},
        headers=auth_header(admin_user),
    )
    assert resp.status_code == 422
