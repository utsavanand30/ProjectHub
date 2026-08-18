# ProjectHub

A web-based Project Management and Daily Activity Management application for small organisations and teams.

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 18 + TypeScript + Tailwind CSS (Vite) |
| Backend    | Python FastAPI                    |
| Database   | PostgreSQL 15                     |
| ORM        | SQLAlchemy 2 + Alembic migrations |
| Auth       | JWT (access + refresh tokens)     |
| Container  | Docker + Docker Compose           |

---

## Quick Start (Docker — recommended)

### 1. Clone and configure

```bash
git clone <repo-url>
cd ProjectHub
cp .env.example .env
```

Open `.env` and set a strong `JWT_SECRET_KEY`:

```bash
# Generate one:
openssl rand -hex 32
```

### 2. Start all services

```bash
docker compose up --build
```

This starts:
- `db` — PostgreSQL on port **5432**
- `backend` — FastAPI on port **8000** (runs `alembic upgrade head` on startup)
- `frontend` — Vite dev server on port **5173**

### 3. Seed sample data

```bash
docker compose exec backend python seed.py
```

This creates three users:

| Role            | Email                        | Password         |
|-----------------|------------------------------|------------------|
| Admin           | admin@projecthub.dev         | Admin@123456     |
| Project Manager | pm@projecthub.dev            | Pm@123456        |
| Team Member     | member@projecthub.dev        | Member@123456    |

It also creates two sample projects, activities, a risk, and an issue.

### 4. Open the app

- **App:** http://localhost:5173
- **API docs (Swagger):** http://localhost:8000/docs
- **API docs (ReDoc):** http://localhost:8000/redoc

---

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

pip install -r requirements.txt

# Copy env and point DATABASE_URL to a local Postgres instance
cp ../.env.example .env
# Edit .env: set DATABASE_URL=postgresql://user:pass@localhost:5432/projecthub

# Run migrations
alembic upgrade head

# Seed data
python seed.py

# Start API server (hot reload)
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

npm install

# Set the API URL (optional — proxied automatically via Vite in Docker)
echo "VITE_API_URL=http://localhost:8000/api/v1" > .env

npm run dev
```

---

## Running Tests

```bash
cd backend
source .venv/bin/activate

# Run all tests (uses SQLite in-memory — no Postgres needed)
pytest

# With coverage
pytest --cov=app --cov-report=term-missing
```

Or inside Docker:

```bash
docker compose exec backend pytest
```

---

## Project Structure

```
ProjectHub/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── core/
│   │   │   ├── config.py        # Pydantic settings (reads .env)
│   │   │   └── security.py      # JWT + bcrypt
│   │   ├── db/
│   │   │   ├── base_class.py    # Base, UUIDMixin, TimestampMixin
│   │   │   ├── base.py          # Imports all models for Alembic
│   │   │   └── session.py       # SQLAlchemy engine + get_db()
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── services/            # Business logic layer
│   │   └── api/
│   │       └── v1/
│   │           ├── api.py       # Aggregates all routers
│   │           └── routers/     # One file per resource
│   ├── alembic/                 # Migrations
│   ├── tests/                   # pytest test suite
│   ├── seed.py                  # Dev seed script
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api/                 # Axios API client modules
        ├── components/
        │   ├── common/          # Badge, Modal, ProgressBar, etc.
        │   └── layout/          # Sidebar, AppLayout
        ├── context/             # AuthContext (JWT, user state)
        ├── pages/               # One folder per feature
        ├── types/               # TypeScript interfaces
        └── utils/               # Date formatting helpers
```

---

## Feature Overview

| Feature               | Admin | Project Manager | Team Member |
|-----------------------|:-----:|:---------------:|:-----------:|
| Create/edit users     | ✓     |                 |             |
| View users            | ✓     |                 |             |
| Create/edit projects  | ✓     | ✓ (own)         |             |
| View projects         | ✓     | ✓ (assigned)    | ✓ (assigned)|
| Post project updates  | ✓     | ✓ (own PM)      |             |
| Log activities        | ✓     | ✓               | ✓           |
| View all activities   | ✓     | ✓ (own projects)|             |
| Edit past activities  | ✓     | ✓ (own)         | ✓ (own)     |
| Manage risks/issues   | ✓     | ✓               | ✓           |
| View audit log        | ✓     |                 |             |
| Dashboard (all data)  | ✓     | ✓ (scoped)      | ✓ (scoped)  |

---

## Environment Variables

All configuration is via environment variables. See `.env.example` for the full list.

| Variable                      | Description                                 |
|-------------------------------|---------------------------------------------|
| `DATABASE_URL`                | PostgreSQL connection string                |
| `JWT_SECRET_KEY`              | Secret for signing JWT tokens               |
| `JWT_ALGORITHM`               | Default: `HS256`                            |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Default: `30`                               |
| `REFRESH_TOKEN_EXPIRE_DAYS`   | Default: `7`                                |
| `BACKEND_CORS_ORIGINS`        | Comma-separated allowed origins             |
| `SEED_ADMIN_EMAIL`            | Admin email created by seed script          |
| `SEED_ADMIN_PASSWORD`         | Admin password created by seed script       |

**Never commit `.env` to source control.** The `.gitignore` already excludes it.

---

## AWS Deployment Path

The application is designed to support AWS deployment with minimal changes:

| Local             | AWS equivalent                  |
|-------------------|---------------------------------|
| Docker Compose    | ECS Fargate (backend container) |
| Vite dev server   | S3 + CloudFront (built assets)  |
| PostgreSQL Docker | Amazon RDS (PostgreSQL)         |
| `.env` file       | AWS Secrets Manager / SSM       |
| Local filesystem  | EFS or S3 (if file uploads added)|

Steps when ready to deploy:
1. Run `npm run build` in `frontend/` and upload `dist/` to S3
2. Configure a CloudFront distribution pointing to the S3 bucket
3. Push the backend Docker image to Amazon ECR
4. Create an ECS Fargate service with the backend image
5. Provision RDS PostgreSQL and update `DATABASE_URL`
6. Move secrets to AWS Secrets Manager and update the ECS task definition
7. Update `BACKEND_CORS_ORIGINS` to the CloudFront distribution URL

---

## API Reference

Full interactive API documentation is auto-generated by FastAPI:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

Key endpoints:

```
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me

GET    /api/v1/users
POST   /api/v1/users
PATCH  /api/v1/users/{id}

GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{id}
PATCH  /api/v1/projects/{id}
DELETE /api/v1/projects/{id}

GET    /api/v1/projects/{id}/updates
POST   /api/v1/projects/{id}/updates

GET    /api/v1/projects/{id}/risks
POST   /api/v1/projects/{id}/risks
PATCH  /api/v1/projects/{id}/risks/{risk_id}
DELETE /api/v1/projects/{id}/risks/{risk_id}

GET    /api/v1/projects/{id}/issues
POST   /api/v1/projects/{id}/issues
PATCH  /api/v1/projects/{id}/issues/{issue_id}
DELETE /api/v1/projects/{id}/issues/{issue_id}

GET    /api/v1/activities
POST   /api/v1/activities
PATCH  /api/v1/activities/{id}
DELETE /api/v1/activities/{id}

GET    /api/v1/dashboard

GET    /api/v1/audit
```
