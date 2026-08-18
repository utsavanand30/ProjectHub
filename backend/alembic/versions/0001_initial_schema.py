"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-14 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Use raw SQL for the entire migration so SQLAlchemy's ORM enum auto-create
# machinery never fires — avoids DuplicateObject errors on re-runs.
UPGRADE_SQL = """
CREATE TYPE userrole       AS ENUM ('admin', 'project_manager', 'team_member');
CREATE TYPE projectstatus  AS ENUM ('not_started', 'in_progress', 'on_hold', 'completed', 'cancelled');
CREATE TYPE projecthealth  AS ENUM ('green', 'amber', 'red');
CREATE TYPE projectpriority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE activitystatus AS ENUM ('planned', 'in_progress', 'completed', 'blocked');
CREATE TYPE riskseverity   AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE risklikelihood AS ENUM ('low', 'medium', 'high');
CREATE TYPE riskstatus     AS ENUM ('open', 'mitigated', 'closed');
CREATE TYPE issueseverity  AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE issuestatus    AS ENUM ('open', 'in_progress', 'resolved', 'closed');

CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          userrole     NOT NULL DEFAULT 'team_member',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_users_id    ON users(id);
CREATE INDEX ix_users_email ON users(email);

CREATE TABLE projects (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_code             VARCHAR(50)      NOT NULL UNIQUE,
    name                     VARCHAR(255)     NOT NULL,
    description              TEXT,
    project_manager_id       UUID             NOT NULL REFERENCES users(id),
    start_date               DATE,
    target_completion_date   DATE,
    expected_completion_date DATE,
    priority                 projectpriority  NOT NULL DEFAULT 'medium',
    status                   projectstatus    NOT NULL DEFAULT 'not_started',
    health                   projecthealth    NOT NULL DEFAULT 'green',
    progress_percentage      INTEGER          NOT NULL DEFAULT 0,
    is_deleted               BOOLEAN          NOT NULL DEFAULT FALSE,
    created_at               TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_projects_id           ON projects(id);
CREATE INDEX ix_projects_project_code ON projects(project_code);

CREATE TABLE project_members (
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE activities (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    date        DATE           NOT NULL,
    user_id     UUID           NOT NULL REFERENCES users(id),
    project_id  UUID           NOT NULL REFERENCES projects(id),
    description TEXT           NOT NULL,
    hours_spent NUMERIC(5,2)   NOT NULL,
    status      activitystatus NOT NULL DEFAULT 'in_progress',
    remarks     TEXT,
    next_action TEXT,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_activities_id         ON activities(id);
CREATE INDEX ix_activities_date       ON activities(date);
CREATE INDEX ix_activities_user_id    ON activities(user_id);
CREATE INDEX ix_activities_project_id ON activities(project_id);

CREATE TABLE project_updates (
    id                       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id               UUID          NOT NULL REFERENCES projects(id),
    updated_by               UUID          NOT NULL REFERENCES users(id),
    progress_percentage      INTEGER       NOT NULL,
    status                   projectstatus NOT NULL,
    health                   projecthealth NOT NULL,
    key_achievements         TEXT,
    key_issues               TEXT,
    risks                    TEXT,
    next_actions             TEXT,
    expected_completion_date DATE,
    created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_project_updates_id         ON project_updates(id);
CREATE INDEX ix_project_updates_project_id ON project_updates(project_id);

CREATE TABLE risks (
    id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID           NOT NULL REFERENCES projects(id),
    title           VARCHAR(255)   NOT NULL,
    description     TEXT,
    severity        riskseverity   NOT NULL DEFAULT 'medium',
    likelihood      risklikelihood NOT NULL DEFAULT 'medium',
    status          riskstatus     NOT NULL DEFAULT 'open',
    mitigation_plan TEXT,
    owner_id        UUID           REFERENCES users(id),
    due_date        DATE,
    created_by      UUID           NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_risks_id         ON risks(id);
CREATE INDEX ix_risks_project_id ON risks(project_id);

CREATE TABLE issues (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id  UUID          NOT NULL REFERENCES projects(id),
    title       VARCHAR(255)  NOT NULL,
    description TEXT,
    severity    issueseverity NOT NULL DEFAULT 'medium',
    status      issuestatus   NOT NULL DEFAULT 'open',
    resolution  TEXT,
    owner_id    UUID          REFERENCES users(id),
    due_date    DATE,
    created_by  UUID          NOT NULL REFERENCES users(id),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_issues_id         ON issues(id);
CREATE INDEX ix_issues_project_id ON issues(project_id);

CREATE TABLE audit_logs (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id   UUID        NOT NULL,
    action      VARCHAR(100) NOT NULL,
    changed_by  UUID        REFERENCES users(id),
    old_value   JSONB,
    new_value   JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ix_audit_logs_id          ON audit_logs(id);
CREATE INDEX ix_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX ix_audit_logs_entity_id   ON audit_logs(entity_id);
"""

DOWNGRADE_SQL = """
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS risks;
DROP TABLE IF EXISTS project_updates;
DROP TABLE IF EXISTS activities;
DROP TABLE IF EXISTS project_members;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS issuestatus;
DROP TYPE IF EXISTS issueseverity;
DROP TYPE IF EXISTS riskstatus;
DROP TYPE IF EXISTS risklikelihood;
DROP TYPE IF EXISTS riskseverity;
DROP TYPE IF EXISTS activitystatus;
DROP TYPE IF EXISTS projectpriority;
DROP TYPE IF EXISTS projecthealth;
DROP TYPE IF EXISTS projectstatus;
DROP TYPE IF EXISTS userrole;
"""


def upgrade() -> None:
    op.execute(UPGRADE_SQL)


def downgrade() -> None:
    op.execute(DOWNGRADE_SQL)
