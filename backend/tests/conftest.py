"""
Test fixtures using SQLite in-memory for fast, isolated tests.
No external PostgreSQL required.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base_class import Base
from app.db.session import get_db
from app.models.user import User, UserRole
from app.core.security import hash_password, create_access_token

# Use SQLite for tests (no Docker needed)
TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def make_user(db, email: str, role: UserRole = UserRole.team_member, name: str = "Test User") -> User:
    user = User(
        name=name,
        email=email,
        password_hash=hash_password("Test@12345"),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def auth_header(user: User) -> dict:
    token = create_access_token(str(user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def admin_user(db):
    return make_user(db, "admin@test.com", UserRole.admin, "Admin User")


@pytest.fixture
def pm_user(db):
    return make_user(db, "pm@test.com", UserRole.project_manager, "PM User")


@pytest.fixture
def member_user(db):
    return make_user(db, "member@test.com", UserRole.team_member, "Member User")
