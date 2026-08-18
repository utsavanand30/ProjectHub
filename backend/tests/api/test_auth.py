import pytest
from tests.conftest import make_user, auth_header
from app.models.user import UserRole


def test_login_success(client, db):
    make_user(db, "user@test.com", UserRole.admin)
    resp = client.post("/api/v1/auth/login", json={"email": "user@test.com", "password": "Test@12345"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "user@test.com"


def test_login_wrong_password(client, db):
    make_user(db, "user@test.com")
    resp = client.post("/api/v1/auth/login", json={"email": "user@test.com", "password": "WrongPass1"})
    assert resp.status_code == 401


def test_login_inactive_user(client, db):
    from app.models.user import User
    user = make_user(db, "inactive@test.com")
    user.is_active = False
    db.commit()
    resp = client.post("/api/v1/auth/login", json={"email": "inactive@test.com", "password": "Test@12345"})
    assert resp.status_code == 403


def test_me_returns_current_user(client, admin_user):
    resp = client.get("/api/v1/auth/me", headers=auth_header(admin_user))
    assert resp.status_code == 200
    assert resp.json()["email"] == admin_user.email


def test_me_unauthorized(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 403  # HTTPBearer returns 403 when no credentials


def test_refresh_token(client, db):
    make_user(db, "user@test.com", UserRole.admin)
    login_resp = client.post("/api/v1/auth/login", json={"email": "user@test.com", "password": "Test@12345"})
    refresh_token = login_resp.json()["refresh_token"]

    resp = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()
